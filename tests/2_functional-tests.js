const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);
const projectName = `test-${Date.now()}`;
let issueId1 = "";
let issueId2 = "";

suite('Functional Tests', function() {
  test("every field", done => {
    chai.request(server).post(`/api/issues/${projectName}`).send({
      issue_title: "test",
      issue_text: "Test issue",
      created_by: "functional_test",
      assigned_to: "assignee",
      status_text: "status"
    }).end((err, res) => {
      console.log(err);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.issue_title, "test");
      assert.strictEqual(res.body.issue_text, "Test issue");
      assert.strictEqual(res.body.created_by, "functional_test");
      assert.strictEqual(res.body.assigned_to, "assignee");
      assert.strictEqual(res.body.status_text, "status");
      assert.strictEqual(res.body.created_on, res.body.updated_on);
      assert.isTrue(res.body.open);
      issueId1 = res.body._id;
      done();
    });
  });
  test("required fields only", done => {
    chai.request(server).post(`/api/issues/${projectName}`).send({
      issue_title: "test2",
      issue_text: "Test issue",
      created_by: "different_user"
    }).end((err, res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.issue_title, "test2");
      assert.strictEqual(res.body.issue_text, "Test issue");
      assert.strictEqual(res.body.created_by, "different_user");
      assert.strictEqual(res.body.assigned_to, "");
      assert.strictEqual(res.body.status_text, "");
      assert.strictEqual(res.body.created_on, res.body.updated_on);
      assert.isTrue(res.body.open);
      issueId2 = res.body._id;
      done();
    });
  });
  test("missing fields", done => {
    chai.request(server).post(`/api/issues/${projectName}`).send({
      issue_title: "missingFields",
      issue_text: "Missing fields"
    }).end((err, res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.error, "required field(s) missing");
      chai.request(server).post(`/api/issues/${projectName}`).send({
        issue_title: "test3",
        issue_text: "Different text",
        created_by: "different_user"
      }).end((err, res) => done());
    });
  });
  test("query all", done => {
    chai.request(server).get(`/api/issues/${projectName}`).end((err, res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 3);
      done();
    });
  });
  test("query single filter", done => {
    chai.request(server).get(`/api/issues/${projectName}`).query({created_by: "different_user"}).end((err, res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 2);
      done();
    });
  });
  test("query multiple filters", done => {
    chai.request(server).get(`/api/issues/${projectName}`).query({created_by: "different_user", issue_text: "Different text"}).end((err, res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.length, 1);
      done();
    });
  });
  test("update one field", done => {
    chai.request(server).put(`/api/issues/${projectName}`).send({_id: issueId1, open: "false"}).end((err, res) => {
      assert.strictEqual(res.status, 200);
      console.log(res.body.error);
      assert.strictEqual(res.body.result, "successfully updated");
      assert.strictEqual(res.body._id, issueId1);
      chai.request(server).get(`/api/issues/${projectName}`).query({_id: issueId1}).end((err, res) => {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.length, 1);
        assert.isNotTrue(res.body[0].open);
        assert.notStrictEqual(res.body[0].created_on, res.body[0].updated_on);
        done();
      });
    });
  });
  test("update multiple fields", done => {
    chai.request(server).put(`/api/issues/${projectName}`).send({_id: issueId2, open: "false", assigned_to: "assignee"}).end((err, res) => {
      assert.strictEqual(res.status, 200);
      console.log(res.body.error);
      assert.strictEqual(res.body.result, "successfully updated");
      assert.strictEqual(res.body._id, issueId2);
      chai.request(server).get(`/api/issues/${projectName}`).query({_id: issueId2}).end((err, res) => {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.length, 1);
        assert.isNotTrue(res.body[0].open);
        assert.strictEqual(res.body[0].assigned_to, "assignee");
        assert.notStrictEqual(res.body[0].created_on, res.body[0].updated_on);
        done();
      });
    });
  });
  test("update missing id", done => {
    chai.request(server).put(`/api/issues/${projectName}`).send({open: "false"}).end((err, res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.error, "missing _id");
      done();
    });
  });
  test("update missing fields", done => {
    chai.request(server).put(`/api/issues/${projectName}`).send({_id: issueId1}).end((err, res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.error, "no update field(s) sent");
      assert.strictEqual(res.body._id, issueId1);
      done();
    });
  });
  test("update invalid id", done => {
    chai.request(server).put(`/api/issues/${projectName}`).send({_id: "1", open: "false"}).end((err, res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.error, "could not update");
      assert.strictEqual(res.body._id, "1");
      done();
    });
  });
  test("delete issue", done => {
    chai.request(server).delete(`/api/issues/${projectName}`).send({_id: issueId1}).end((err, res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.result, "successfully deleted");
      assert.strictEqual(res.body._id, issueId1);
      chai.request(server).get(`/api/issues/${projectName}`).query({_id: issueId1}).end((err, res) => {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.length, 0);
        done();
      });
    });
  });
  test("delete invalid id", done => {
    chai.request(server).delete(`/api/issues/${projectName}`).send({_id: "1"}).end((err, res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.error, "could not delete");
      assert.strictEqual(res.body._id, "1");
      done();
    });
  });
  test("delete missing id", done => {
    chai.request(server).delete(`/api/issues/${projectName}`).end((err, res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.error, "missing _id");
      done();
    });
  });
});
