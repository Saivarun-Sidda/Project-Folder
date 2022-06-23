const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");

const web3 = new Web3(ganache.provider());

const compiledBillSystem = require("../ethereum/build/BillSystem.json");

let accounts;
let billSystem;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    billSystem = await new web3.eth.Contract(JSON.parse(compiledBillSystem.interface))
        .deploy({ data: compiledBillSystem.bytecode })
        .send({ from: accounts[0], gas: "0x3d0900" });
});

describe("Bill System", () => {
    it("bill-system is created.", () => {
        assert.ok(billSystem.options.address);
    });


    it("admin is the deployer of the contract.", async () => {
        let value = await billSystem.methods.setUser().call({ from: accounts[0] });
        assert.equal(value, "Admin");
    });


    it("member is in pending state without approval or rejection by admin.", async () => {
        await billSystem.methods.createRequest("chintu", "jpg", "png").send({ from: accounts[1], gas: "0x3d0900" });
        let res = await billSystem.methods.setUser().call({ from: accounts[1] });
        assert.equal(res, "Pending");
    });


    it("member is approved successfully.", async () => {
        await billSystem.methods.createRequest("chintu", "jpg", "png").send({ from: accounts[1], gas: "0x3d0900" });
        await billSystem.methods.approveMember(accounts[1]).send({ from: accounts[0], gas: "0x3d0900" });
        let res = await billSystem.methods.setUser().call({ from: accounts[1] });
        assert.equal(res, "Member");
    });


    it("member rejected successfully.", async () => {
        await billSystem.methods.createRequest("deepak", "jpg", "png").send({ from: accounts[1], gas: "0x3d0900" });
        await billSystem.methods.rejectMember(accounts[1]).send({ from: accounts[0], gas: "0x3d0900" });
        let res = await billSystem.methods.setUser().call({ from: accounts[1] });
        assert.equal(res, "Rejected");
    });


    it("bill is created successfully.", async () => {
        await billSystem.methods.createRequest("chintu", "jpg", "png").send({ from: accounts[1], gas: "0x3d0900" });
        await billSystem.methods.approveMember(accounts[1]).send({ from: accounts[0], gas: "0x3d0900" });
        await billSystem.methods.createBill("14th Feb, 2023", "Love Act", "someUrl").send({ from: accounts[1], gas: "0x3d0900" });
        let billCount = await billSystem.methods.billCount().call();
        assert.equal(billCount, "1");
    });


    it("member's vote recorded successfully.", async () => {
        await billSystem.methods.createRequest("chintu", "jpg", "png").send({ from: accounts[1], gas: "0x3d0900" });
        await billSystem.methods.approveMember(accounts[1]).send({ from: accounts[0], gas: "0x3d0900" });

        await billSystem.methods.createBill("Date-Random", "Random Act", "SomeUrl").send({ from: accounts[1], gas: "0x3d0900" });

        await billSystem.methods.createRequest("sweety", "jpg", "png").send({ from: accounts[2], gas: "0x3d0900" });
        await billSystem.methods.approveMember(accounts[2]).send({ from: accounts[0], gas: "0x3d0900" });

        let isVoted = await billSystem.methods.isVoted(0, accounts[2]).call();
        assert.equal(isVoted, false);

        await billSystem.methods.voteToBill(0, true, "I like the proposition of the bill.")
            .send({ from: accounts[2], gas: "0x3d0900" });

        isVoted = await billSystem.methods.isVoted(0, accounts[2]).call();
        assert.equal(isVoted, true);

        await billSystem.methods.createRequest("bablu", "jpg", "png").send({ from: accounts[3], gas: "0x3d0900" });
        await billSystem.methods.approveMember(accounts[3]).send({ from: accounts[0], gas: "0x3d0900" });

        await billSystem.methods.voteToBill(0, false, "I donot like the proposition of the bill.")
            .send({ from: accounts[3], gas: "0x3d0900" });

        const data = await billSystem.methods.getVoteAndAgreeCount(0).call({ from: accounts[2] });
        let voteCount = data[0];
        let agreeCount = data[1];
        assert.equal(voteCount, 2);
        assert.equal(agreeCount, 1);
    });
});
