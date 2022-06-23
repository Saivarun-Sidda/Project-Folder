pragma solidity ^0.4.17;

contract BillSystem {

    // Variables

    struct Request {
        bool valid;
        bool rejected;
        bool pending;
    }
    mapping (address => Request) public requests;
    mapping (address => bool) public isRequested;

    struct Member {
        string name;
        string avatar;
        string document;
    }
    mapping (address => Member) public members;
    Member[] public memberArray;
    uint16 public memberCount;

    address private admin;
    
    struct Vote {
        bool choice;
        string reason;
    }
    struct Bill {
        address proposedBy;
        string deadLine;
        string title;
        string url;
        bool alive;
        bool passed;
        mapping(address => Vote) vote;
        mapping(address => bool) voted;
        uint votecount;
        uint agreecount;
    }
    Bill[] public bills;
    uint public billCount;


    // modifiers
    
    modifier adminOnly() {
        require(msg.sender == admin);
        _;
    }

    modifier memberOnly() {
        require(requests[msg.sender].valid);
        _;
    }

    // functions

    function BillSystem() public {
        admin = msg.sender;
    }

    function setUser() public view returns(string) {
        if(msg.sender == admin) return "Admin";
        else if(requests[msg.sender].valid) return "Member";
        else if(requests[msg.sender].pending) return "Pending";
        else if(requests[msg.sender].rejected) return "Rejected";
        else return "Guest";
    }

    function getAdmin() public view returns(address) {
        return admin;
    }

    function approveMember(address id) public adminOnly {
        require(isRequested[id]);
        require(id != msg.sender);
        requests[id].valid = true;
        requests[id].pending = false;
        memberCount += 1;
        memberArray.push(members[id]);
    }

    function rejectMember(address id) public adminOnly {
        require(isRequested[id]);
        require(id != msg.sender);
        requests[id].pending = false;
        requests[id].rejected = true;
        isRequested[id] = false;
    }

    function createRequest(string memory n, string memory a, string memory d) public {
        Member memory m = Member({
            name: n,
            avatar: a,
            document: d
        });
        members[msg.sender] = m;
        Request memory r = Request({
            valid: false,
            rejected: false,
            pending: true
        });
        requests[msg.sender] = r;
        isRequested[msg.sender] = true;
    }

    function createBill(string memory dead, string memory tit, string memory u) public memberOnly {
        Bill memory b = Bill({
            proposedBy: msg.sender,
            deadLine: dead,
            title: tit,
            url: u,
            alive: true,
            passed: false,
            votecount: 0,
            agreecount: 0
        });
        bills.push(b);
        billCount += 1;
    }

    function closeBill(uint i) public adminOnly {
        bills[i].alive = false;
    }

    function passBill(uint i) public adminOnly {
        bills[i].alive = false;
        bills[i].passed = true;
    }

    function calculateBill(uint i) public adminOnly returns (bool) {
        uint v = bills[i].votecount;
        uint a = bills[i].agreecount;
        bool result = false;
        if(a>(v-a)) { passBill(i); result = true; }
        else { closeBill(i); result = false; }
    }

    function getUrl(uint i) public view returns(string) {
        Bill storage b = bills[i];
        return b.url;
    }

    function getResponse(uint i, address a) public view returns(bool, string){
        Vote storage v = bills[i].vote[a];
        return (v.choice, v.reason);
    }

    function getVoteAndAgreeCount(uint i) public memberOnly view returns(uint, uint){
        return (bills[i].votecount, bills[i].agreecount);
    }

    function isVoted(uint i, address a) public view returns(bool) {
        return bills[i].voted[a];
    }

    function voteToBill(uint i, bool c, string memory r) public memberOnly {
        // require(bills[i].proposedBy != msg.sender);
        require(bills[i].alive == true);
        require(!isVoted(i, msg.sender));
        Vote memory v = Vote({
            choice: c,
            reason: r
        });
        bills[i].vote[msg.sender] = v;
        bills[i].votecount += 1;
        if(c == true) bills[i].agreecount += 1;
        bills[i].voted[msg.sender] = true;
    }
}
