var testok = runtests();

function runtests() {
    try
    {
        assert (true, true);
        // IPv4:
        checkIP4AddrRep ("255.255.255.255", "255.255.255.255");
        checkIP4AddrRep ("127.0.0.0", "127.000.000.000", true);
        checkIP4AddrRep ("127.0.0.0", "127.0.0.0", false);
        checkIP4AddrRep ("79.216.64.0", "079.216.064.000", true);
        checkIP4AddrRep ("79.216.64.0/24", "079.216.064.000/24", true);
        checkIP4AddrRep ("79.216.7.255/22", "079.216.004.000/22", true);
        checkIP4AddrRep ("255.255.255.255/31", "255.255.255.254/31");
        checkIP4AddrRep ("255.255.255.255/24", "255.255.255.0/24", false);
        checkIP4AddrRep ("255.255.255.255/1", "128.000.000.000/1", true);
        checkIP4AddrRep ("255.255.255.255/0", "000.000.000.000/0", true);
        checkInvalid ("127.0.0.0000");
        checkInvalid ("127.0.0.");
        checkInvalid ("127..0.0");
        checkInvalid ("127.0.0.0.0");
        checkInvalid ("127.0.0.256");
        checkInvalid (" 127.0.0.0");
        checkInvalid ("127.0.0.0/33");
        checkInvalid ("127.0.0.0 ");
        // IPv6:
        checkIP6AddrRep ("2001:0db8:85a3:08d3:1319:8a2e:0370:7344", "2001:db8:85a3:8d3:1319:8a2e:370:7344");
        checkIP6AddrRep ("2001:0db8:85a3:08d3:1319:8a2e:0370:7344", "2001:0db8:85a3:08d3:1319:8a2e:0370:7344", true, false, false);
        checkIP6AddrRep ("2001:0db8:85a3:08d3:1319:8a2e:0370:7344", "2001:0DB8:85A3:08D3:1319:8A2E:0370:7344", true, true, false);
        checkIP6AddrRep ("2001:0db8:85a3:08d3:1319:8a2e:0370:7344", "2001:DB8:85A3:8D3:1319:8A2E:370:7344", false, true, false);
        checkIP6AddrRep ("1:0db8:85a3:08d3:1319:8a2e:0370:7344", "1:db8:85a3:8d3:1319:8a2e:370:7344");
        checkIP6AddrRep ("2001:0db8:85a3:08d3:1319:8a2e:255.255.255.255", "2001:db8:85a3:8d3:1319:8a2e:ffff:ffff");
        checkIP6AddrRep ("1:2:3:4:5:6:7:8", "1:2:3:4:5:6:7:8");
        checkIP6AddrRep ("::2:3:4:5:6:7:8", "0:2:3:4:5:6:7:8");
        checkIP6AddrRep ("1:2:3:4:5:6:7::", "1:2:3:4:5:6:7:0");
        checkIP6AddrRep ("1:2:3::6:7:8", "1:2:3:0:0:6:7:8");
        checkIP6AddrRep ("1:2::6:7:8", "1:2:0:0:0:6:7:8");
        checkIP6AddrRep ("f:f:f::f:f", "f:f:f:0:0:0:f:f");
        checkIP6AddrRep ("f:f:f::f:f", "f:f:f::f:f", false, false, true);
        checkIP6AddrRep ("f:f:f:0:f:f:f:f", "f:f:f::f:f:f:f", false, false, true);
        checkIP6AddrRep ("f:0:0:f:f:0:0:f", "f::f:f:0:0:f", false, false, true);
        checkIP6AddrRep ("0:0:0:0:0:0:0:0", "::", false, false, true);
        checkIP6AddrRep ("F:0:0:0:0:0:0:0", "f::", false, false, true);
        checkIP6AddrRep ("0:0:0:0:0:0:0:F", "::f", false, false, true);
        checkInvalid ("f:f:f:f:f:f:f:fffff");
        checkInvalid ("fffff:f:f:f:f:f:f:f");
        checkInvalid ("f:f:f:f:f:f:f:f:f");
        checkInvalid ("f:f:f:f:f:f:f:f:");
        checkInvalid ("f:f:f:f:f:f:f:");
        checkInvalid ("f:f:f:f:f:f:f");
        checkInvalid ("f:f:f:f:f:f:f:255.255.255.255");
        checkInvalid ("f:f:f:f:f:255.255.255.255");
       
        var addr1 = new Address("255.255.255.255");
        assert (addr1.isIP4(), true);
        assert (addr1.prefix, 32);
        assert (addr1.getBit(0), 1);
        assert (addr1.getBit(31), 1);
        assert (addr1.getBit(32), 0);
        assert (addr1.getBit(127), 0);
        assertNaN (addr1.getBit(-1));
        assertNaN (addr1.getBit(128));
        var addr2 = new Address("255.255.255.255/16");
        assert (addr2.prefix, 16);
        addr2 = new Address("255.255.255.255/24");
        assert (addr2.prefix, 24);
        addr2 = new Address("255.255.254.0");
        addr1.setBits(9, 0);
        checkEqual (addr1, addr2);
        assert (addr1.getBit(8), 0);
        assert (addr1.getBit(9), 1);
        
        // compare:
        checkCompare("0.0.0.0", "0.0.0.1", -1);
        checkCompare("0.0.0.0/30", "0.0.0.1", -1);
        checkCompare("0.0.0.0/30", "0.0.0.0", -1);
        checkCompare("0.0.0.0/30", "0.0.0.0/24", 1);
        
        // rangeTop:
        addr1 = new Address("123.234.100.100/16");
        addr2 = new Address("123.234.255.255");
        checkEqual (addr1.rangeTop(), addr2);
        checkEqual (addr2.rangeTop(), addr2);
        
        // type + isRange:
        addr1 = new Address ("0.0.0.0");
        assert (addr1.isRange(), false);
        assert (addr1.getType(), "IPv4");
        addr1 = new Address ("0.0.0.0/30");
        assert (addr1.isRange(), true);
        assert (addr1.getType(), "IPv4");
        addr1 = new Address ("::");
        assert (addr1.isRange(), false);
        assert (addr1.getType(), "IPv6");
        addr1 = new Address ("::/30");
        assert (addr1.isRange(), true);
        assert (addr1.getType(), "IPv6");
        
        // getAddressList:
        checkGetAddressList ("2001:0db8:85a3:08d3:1319:8a2e:0370:7344", 1);

        checkGetAddressList ("", 0);
        checkGetAddressList ("foo bar", 0);
        checkGetAddressList ("1:", 0);
        checkGetAddressList ("1.", 0);
        checkGetAddressList ("123.234.255.255", 1);
        checkGetAddressList ("123 123.234.255.255 123", 1);
        checkGetAddressList ("2001:0db8:85a3:08d3:1319:8a2e:0370:7344", 1);
        checkGetAddressList ("abcd 123.234.255.255 abcd 2001:0db8:85a3:08d3:1319:8a2e:0370:7344 abcd", 2);
        return true;
    } catch (e) {
        console.log (e.message);
        var stack = e.stack;
        console.log (stack);
        return false;
    }
}

function assert (val, expected) {
    if (! (val == expected))
        throw new Error("test failed: expected='" + expected + "'; val='" + val + "'");
}

function assertNaN (val) {
    if (! (typeof val === "number" && isNaN(val)))
        throw new Error("test failed:  expected NaN; val='" + val + "'");
}

function checkIP4AddrRep (straddr, expected, patch = false) {
    var addr = new Address (straddr);
    if (! addr.isValid())
        throw new Error("test failed: straddr='" + straddr + "' should be valid");
    var strres = addr.toIP4String(patch);
    return assert (strres, expected);
}

function checkIP6AddrRep (straddr, expected, patch = false, uppercase = false, collapse = false) {
    var addr = new Address (straddr);
    if (! addr.isValid())
        throw new Error("test failed: straddr='" + straddr + "' should be valid");
    var strres = addr.toIP6String(patch, uppercase, collapse);
    return assert (strres, expected);
}

function checkCompare (straddr1, straddr2, expected) {
    var addr1 = new Address(straddr1);
    var addr2 = new Address(straddr2);
    checkCompareAddr (addr1, addr2, expected);
    if (expected)
        checkCompareAddr (addr2, addr1, -expected);
}

function checkCompareAddr (addr1, addr2, expected) {
    var cmp = compare (addr1, addr2);
    cmp = cmp < 0 ? -1 : (cmp > 0 ? +1 : 0);
    var exp;
    switch (expected) {
        case -1: exp = '<'; break;
        case 0: exp = '='; break;
        case +1: exp = '>'; break;
    }
    if (cmp != expected)
        throw new Error("test failed: addr1='" + addr1 + "' " + exp + " addr2='" + addr2 + "' expected");
}
    
function checkEqual (addr1, addr2) {
    checkCompareAddr (addr1, addr2, 0);
}

function checkInvalid (straddr) {
    var addr = new Address (straddr);
    if (addr.isRange())
		throw new Error("test failed: invalid address cannot be range");
    if (addr.isValid()) 
        throw new Error("test failed: straddr='" + straddr + "' should be invalid");
}

function checkGetAddressList (text, exp) {
	res = getAddressList(text);
	cnt = res.length;
    if (cnt != exp)
        throw new Error("test failed: text='" + text + "' cnt=" + cnt + "; " + exp + " expected");
}
