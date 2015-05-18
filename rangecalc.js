
/*
Extracts sorted array without duplicates from given text.

Parameters:
    text    given text

Returns:
    sorted array of Address objects without duplicates
*/
function getAddressList(text) {
    text = text.toLowerCase();
    var addresses = text.match(re_addr);
    if (addresses === null)
        return [];
    var addressList = [];
    var cnt = 0;
    for (var i = 0; i < addresses.length; ++i) {
        var adr = new Address(addresses[i]);
        if (adr.isValid())
            addressList[cnt++] = adr;
    }
    addressList.sort(compare);
    for (var i = 0; i < addressList.length-1; ++i) {
        if (addressList[i].equals(addressList[i+1]))
            addressList.splice(i, 1);
    }
    return addressList;
}

function getTreeHtml(addressList) {
	if (! addressList.length) 
		return "&lt;empty&gt;";
	var ip4 = [];
	var ip6 = [];
	for (var i = 0; i < addressList.length; ++i)
		if (addressList[i].isIP4())
			ip4.push(addressList[i]);
		else
			ip6.push(addressList[i]);
	
	var treeHtml = "";
	if (ip4.length) {       
		ip4 = removeSubranges(ip4);
		var tree = new TreeNode (ip4, 31);
		treeHtml = tree.toHtml();
	}
	if (ip6.length) {       
		ip4 = removeSubranges(ip6);
		var tree = new TreeNode (ip6, 127);
		treeHtml += tree.toHtml();
	}
	return treeHtml;
}

function removeSubranges (addressList) {
    for (var i = 0; i < addressList.length-1; ++i) {
        if (addressList[i+1].contains(addressList[i]))
            addressList.splice(i, 1);
    }
    return addressList;
}

function dumpAddressList(addressList) {
    if (! addressList)
        return "";
    var dump = [];
    for (var i = 0; i < addressList.length; ++i)
        dump.push(addressList[i].toString());
    return dump.join('\n');
    
}

/*
Splits array of addresses into two arrays with bit 0 or bit 1 at given position.
Parameters:
    addrs   input array
    bit     bit position (0 is rightmost, 127 leftmost)
    addrs0  result array of addresses with bit 0 at given position
    addrs1  result array of addresses with bit 1 at given position
*/
function splitAddrList(addrs, bit, addrs0, addrs1) {
    for (var i = 0; i < addrs.length; ++i) {
        if (addrs[i].getBit(bit))
            addrs1.push(addrs[i]);
        else
            addrs0.push(addrs[i]);
    }
}

function TreeNode (addrs, bit) {
    if (addrs === undefined)
        throw new Error("invalid argument in Treenode constructor");
    if (addrs.length < 2) {
        this.leaf = true;
        this.addrs = addrs[0];
    } else {
        this.leaf = false;
        while (bit >= 0) {
            this.addrs0 = [];
            this.addrs1 = [];
            splitAddrList (addrs, bit, this.addrs0, this.addrs1);
            if (this.addrs0.length && this.addrs1.length)
                break;
            --bit;
        }
        this.addrs0 = new TreeNode (this.addrs0, bit);
        this.addrs1 = new TreeNode (this.addrs1, bit);
        this.addrs = new Address (addrs[0]);
        var size = this.addrs.isIP4() ? 32 : 128;
        this.addrs.setBits(bit+1, 0);
        this.addrs.prefix = size - (bit+1);
    }
    this.bit = bit;
}

TreeNode.prototype.toHtml = TreeNode_toHtml;
function TreeNode_toHtml() {
    if (this.leaf) {
        return this.addrsToHtml();
    } else {
        return this.addrsToHtml() +
            "<ul><li>" + this.addrs0.toHtml() + "</li>\n<li>" + this.addrs1.toHtml()  + "</li>\n" + "</ul>";
    }
}
TreeNode.prototype.addrsToHtml = function() {
    var html = this.addrs.toString();
    var prefix = this.addrs.prefix;
    if (this.addrs.isIP4()) {
        if (prefix != 32)
            html += " (" + this.subnetSize(32-prefix) + ")" 
    } else {
        if (prefix != 128) {
            if (prefix < 64) {
                html += " (/64: " + this.subnetSize(64-prefix);
                if (prefix < 48) 
                    html += ";/48: " + this.subnetSize(48-prefix);
                html += ")";
            }
        }
    }
    return html;    
}

/* Returns string representation of subnet size.
*/
TreeNode.prototype.subnetSize = function(size) {
    var adrcnt = Math.pow(2, size);
    if (adrcnt > 10000000) {
        var log10 = Math.floor(Math.log(adrcnt)/Math.LN10);
        return "> 10^" + log10;
    } else
        return adrcnt.toString();
}

/*
Address object constructor.

Constructor parameters:
    arg         string representation or another address object
Members:
    address     IPv6 address (8 16 bit numbers)
                null, if invalid
    prefix      prefix length in bits
    type        4 for IPv4, 6 for IPv6, 0 for invalid
*/
function Address(arg) {
    this.clear();
    if (typeof arg == "string") {
        this.fromString(arg);
    } else if (typeof arg == "object" && arg.constructor.name == "Address") {
        this.address = arg.address.slice();
        this.prefix = arg.prefix;
        this.type = arg.type;
    } else {
        throw "constructor not implemented";
    }
}

Address.prototype.clear = Address_clear;
function Address_clear () {
    this.address = [];
    for (var i = 0; i < 8; ++i)
        this.address[i] = 0;
}

Address.prototype.compare = Address_compare;
function Address_compare(other) {
    for (var i = 7; i >= 0; --i) {
        var d = this.address[i] - other.address[i];
        if (d)
            return d;
    }
    return this.prefix - other.prefix;
}

Address.prototype.contains = Address_contains;
function Address_contains(other) {
    var d1 = this.compare(other);
    if (d1 > 0)
        return false;
    var d2 = this.rangeTop().compare(other.rangeTop());
    return d2 >= 0;
}

Address.prototype.equals = Address_equals;
function Address_equals(other) {
    return this.compare(other) == 0;
}

var p_ip4 = "(([0-9]{1,3}\\.){3}[0-9]{1,3})";
var re_ip4 = new RegExp ("^" + p_ip4 + "$");
var re_ip4_end = new RegExp (p_ip4 + "$");

var p_ip6_parts = "[0-9a-f]{1,4}(:[0-9a-f]{1,4}){0,7}"
var re_ip6_parts = new RegExp ("^" + p_ip6_parts + "$");

var p_ip6 = "(::([0-9a-f]{1,4}:){0,7}([0-9a-f]{1,4})?|([0-9a-f]{1,4}:){1,7}(:[0-9a-f]{1,4}){1,7}|[0-9a-f]{1,4}(:[0-9a-f]{1,4}){7})(:" + p_ip4 + ")?";

var p_prefix = "(\\/[0-9]+)";
var re_prefix = new RegExp (p_prefix + "$");

var p_addr = "(" + p_ip6 + "|"  + p_ip4 + ")" + p_prefix + "?";
var re_addr = new RegExp(p_addr, "g");

/* 
Convert string representation of IPv4 address.
*/
Address.prototype.fromIP4 = Address_fromIP4;
function Address_fromIP4(straddr) {
    var parts = straddr.match(/[0-9]{1,3}/g);
    if (parts.length != 4)
        this.type = 0;
    for (var i = 0; i < parts.length; ++i) {
        var p = parseInt(parts[i]);
        if (p > 0xff)
            this.type = 0;
        var high = 1- i % 2;
        var index = 1 - (i - i%2) / 2;
        this.address[index] |= high ? p << 8 : p;
    }
    if (this.prefix != 32)
        this.setBits(32-this.prefix, 0);
}

/*
Convert string representation of IPv6 address.
Parameter:
    straddr     string representation of IPv6 address (not containing "::")
    ip4flag     only starting part, i.e. an IPv4 representation has been removed
*/
Address.prototype.fromIP6 = Address_fromIP6;
function Address_fromIP6(straddr, ip4flag) {
    var seqIndex = straddr.indexOf("::");
    var offset = ip4flag ? 2 : 0;
    var maxParts = 8 - offset;
    if (seqIndex == -1) {
        var parts = this.fromIP6_aux (straddr, offset, true);
        if (parts != maxParts)
            this.type = 0;
    } else if (seqIndex == 0) {
        // :: at beginning
        if (straddr.length > 2) {
            // exclude :: pure dotted quad / unspecified address
            var parts = this.fromIP6_aux (straddr.substr(2), offset, true);
            if (parts > maxParts-1)
                this.type = 0;
            else {
                var zerosparts = maxParts-parts;
                for (var i = 0; i < zerosparts; ++i)
                    this.address[7-i] = 0;
            }
        }
    } else if (seqIndex == straddr.length-2) {
        // :: at end
        var parts = this.fromIP6_aux (straddr.substring(0, seqIndex), 7, false);
        if (parts > maxParts-1)
            this.type = 0;
        else {
            var zeroparts = maxParts-parts;
            for (var i = 0; i < zeroparts; ++i)
                this.address[offset+i] = 0;
        }
    } else {
        // :: in the middle
        var parts1 = this.fromIP6_aux (straddr.substring(0, seqIndex), 7, false);
        var parts2 = this.fromIP6_aux (straddr.substring(seqIndex+2, straddr.length), offset, true);
        var parts = parts1 + parts2;
        if (parts > maxParts-1)
            this.type = 0;
        else {
            var zeroparts = maxParts-parts;
            for (var i = 0; i < zeroparts; ++i)
                this.address[offset + parts2 + i] = 0;
        }
    }
    if (this.prefix != 128)
        this.setBits(128-this.prefix, 0);
}
/*
Helper function.
Parameter: 
    index           first index to use
    lowfirst        if true, fill index, index+1 ..., else fill index, index-1, ... 
*/
Address.prototype.fromIP6_aux = Address_fromIP6_aux;
function Address_fromIP6_aux(straddr, index, lowfirst) {
    var res = re_ip6_parts.exec(straddr);
    if (! res) {
        this.type = 0;
        return 0;
    }
    var parts = straddr.match(/[0-9a-f]{1,4}/g);
    if (! parts)
        return 0;
    if (lowfirst) {
        for (var i = parts.length-1; i >= 0; --i) {
            var p = parseInt(parts[i], 16);
            if (p > 0xffff)
                this.type = 0;
            if (index < 8 && index >= 0)
                this.address[index] = p
            ++index;
        }
    } else {
        for (var i = 0; i < parts.length; ++i) {
            var p = parseInt(parts[i], 16);
            if (p > 0xffff)
                this.type = 0;
            if (index < 8 && index >= 0)
                this.address[index] = p
            --index;
        }
    }
    return parts.length;
}

Address.prototype.fromString = Address_fromString;
function Address_fromString (straddr) {
 
    // match prefix
    var res = re_prefix.exec (straddr);
    if (res) {
        var str_prefix = res[0];
        straddr = straddr.substring(0, straddr.length-str_prefix.length);
        this.prefix = parseInt (str_prefix.substr(1));
    } 
        
    res = re_ip4.exec(straddr);
    if (res)  {
        this.type = 4;
        var str_ip4 = res[0];
        this.fromIP4 (str_ip4);
        if (this.prefix === undefined)
            this.prefix = 32;
        else if (this.prefix > 32)
            this.type = 0;
    } else {
        this.type = 6;
        straddr = straddr.toLowerCase();
        res = re_ip6_parts.exec(straddr);
        if (res) {
            this.fromIP6(straddr, false);   // Format: XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX
        } else {
            res = re_ip4_end.exec(straddr);
            var ip4suffix = false;
            if (res) {
                var str_ip4 = res[0];       // Format: XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:xxx.xxx.xxx.xxx
                var strlen = straddr.length-str_ip4.length-1;
                if (straddr.charAt(strlen) != ':') {
                    this.type = 0;
                    return;
                }
                straddr = straddr.substr(0, strlen);
                this.fromIP4(str_ip4);
                ip4suffix = true;
            }
            this.fromIP6(straddr, ip4suffix);
        }
        if (this.prefix === undefined)
            this.prefix = 128;
        else if (this.prefix > 128)
            this.type = 0;
    }
}

/*
Returns the bit value at position 'bit'.
0 is rightmost, 127 leftmost.
*/
Address.prototype.getBit = Address_getBit;
function Address_getBit(bit) {
    if (bit < 0 || bit > 127)
        return NaN;
    var mask = 1 << (bit % 16);
    var index = (bit - bit%16)/16;
    return (this.address[index] & mask) ? 1 : 0;
}

Address.prototype.isIP4 = Address_isIP4;
function Address_isIP4() {
    return this.type == 4;
}

Address.prototype.isRange = Address_isRange;
function Address_isRange() {
    switch (this.type) {
    case 0:
        return false;
    case 4:
        return this.prefix != 32;
    case 6:
        return this.prefix != 128;
    default:
        throw new Error ("invalid type " + this.type);
    }
}

Address.prototype.isValid = Address_isValid;
function Address_isValid() {
    return this.type != 0;
}

Address.prototype.rangeTop = Address_rangeTop;
function Address_rangeTop() {
    var addrlen = this.isIP4() ? 32 : 128;
    if (!this.prefix == addrlen)
        return this;
    var masklen = addrlen - this.prefix;
    var copy = new Address(this);
    copy.setBits(masklen, 1);
    copy.prefix = addrlen;
    return copy;
}

/*
Set the lowest 'count' bits to 'bit'.
*/
Address.prototype.setBits = Address_setBits;
function Address_setBits(count, bit) {
    var parts = (count - count%16) / 16;
    if (bit) {
        for (var i = 0; i < parts; ++i)
            this.address[i] = 0xffff;
        this.address[parts] |= getmask(count%16);
    } else {
        for (var i = 0; i < parts; ++i)
            this.address[i] = 0;
        this.address[parts] &= ~getmask(count%16);
    }
}

/*
Convert IPv4 address to string.
Parameters:
    patch   patch address parts with 0
*/
Address.prototype.toIP4String = Address_toIP4String;
function Address_toIP4String(patch = false) {

    var a = this.address[0] | (this.address[1] << 16);
    var s = "";
    for (var i = 0; i < 4; ++i) {
        var p = format (a & 0xff, 10, patch ? 3 : 0);
        a >>= 8;
        s = s.length ? p + "." + s : p;
    }
    if (this.prefix != 32)
        s = s + "/" + this.prefix;
    return s;
}

/*
Convert IPv6 address to string.
Parameters:
    patch       patch address parts with 0
    uppercase   use uppercase for hex digits
    collapse    replace longest zero part sequence with '::'
*/
Address.prototype.toIP6String = Address_toIP6String;
function Address_toIP6String(patch=false, uppercase = false, collapse = false) {
    var s = "";

    var maxpos = -1;
    var maxlen = -1;
    var curpos = -1;
    var curlen = -1;
    for (var i = 7; i >= 0; --i) {
        if (this.address[i] == 0) {
            if (curpos == -1) {
                curpos = i;
                curlen = 1;
            } else
                ++curlen;
            if (curlen > maxlen) {
                maxpos = curpos;
                maxlen = curlen;
            }
        } else
            curpos = curlen = -1;
    }
    
    for (var i = 7; i >= 0; --i) {
        if (i == maxpos && collapse) {
            if (i+1 == maxlen) {
				s += "::";
				break;
			}
            s += ':';
            i -= maxlen-1;
            continue;
        }
        var p = format(this.address[i], 16, patch ? 4 : 0);
        s += s.length ? ":" + p : p;
    }
    
    if (this.prefix != 128)
        s = s + "/" + this.prefix;
    if (uppercase)
        s = s.toUpperCase();
    return s;
}

/*
Convert IP address to string.
*/
Address.prototype.toString = Address_toString;
function Address_toString() {
    if (this.isIP4())
        return this.toIP4String();
    else
        return this.toIP6String();
}

/*
Return type as string.
*/
Address.prototype.getType = Address_getType;
function Address_getType() {
    switch (this.type) {
        case 0: return "invalid";
        case 4: return "IPv4";
        case 6: return "IPv6";
        default: throw new Error("invalid type " + this.type);
    }
}

// Auxiliary functions:

function compare (a, b) {
    return a.compare(b);
}

function format (n, base, digits) {
    var s = n.toString(base);
    var patch = s.length < digits ? digits-s.length : 0;
    while (patch--)
        s = "0" + s;
    return s;
}

var masks = [
    0,
    0x1,
    0x3,
    0x7,
    0xf,
    0x1f,
    0x3f,
    0x7f,
    0xff,
    0x1ff,
    0x3ff,
    0x7ff,
    0xfff,
    0x1fff,
    0x3fff,
    0x7fff,
    0xffff,
    0x1ffff,
    0x3ffff,
    0x7ffff,
    0xfffff,
    0x1fffff,
    0x3fffff,
    0x7fffff,
    0xffffff,
    0x1ffffff,
    0x3ffffff,
    0x7ffffff,
    0xfffffff,
    0x1fffffff,
    0x3fffffff,
    0x7fffffff,
    0xffffffff
];
function getmask(len) {
    return masks[len];
}
