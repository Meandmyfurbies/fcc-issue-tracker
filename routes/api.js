'use strict';
const mongoose = require("mongoose");
require("dotenv").config;
const objectId = mongoose.Types.ObjectId;
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});
const issueSchema = new mongoose.Schema({
  project: {
    type: String,
    required: true
  },
  issue_title: String,
  issue_text: String,
  created_by: String,
  assigned_to: String,
  status_text: String,
  created_on: Date,
  updated_on: Date,
  open: Boolean
});
const Issue = mongoose.model("Issue", issueSchema);
const objectWithoutKey = (object, key) => {
  const {[key]: deletedKey, ...otherKeys} = object;
  return otherKeys;
}
const populate = (source, fields, obj={}) => {
  fields.forEach(field => {
    if(source[field]) {
      obj[field] = source[field];
    }
  });
  return obj;
}
const updateFields = ["issue_title", "issue_text", "created_by", "assigned_to", "status_text", "open"];
const queryFields = updateFields.concat(["created_on", "updated_on", "_id"]);
module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(async function (req, res){
      let project = req.params.project;
      let query = populate(req.query, queryFields);
      query.project = project;
      if(query.open === "true") query.open = true;
      if(query.open === "false") query.open = false;
      if(req.query._id) query._id = objectId(req.query._id);
      console.log(query);
      try {
        const issuesDocs = await Issue.find(query).select("-project");
        if(issuesDocs !== null) {
          res.json(issuesDocs);
        } else {
          res.json({error: "No issues"});
        }
      } catch {
        res.json({error: "Error getting issues"});
      }
    })
    
    .post(function (req, res){
      let project = req.params.project;
      if(req.body.issue_title === undefined || req.body.issue_text === undefined || req.body.created_by === undefined) {
        res.json({error: "required field(s) missing"});
      } else {
        const newIssue = new Issue({
          project: project,
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          assigned_to: (req.body.assigned_to === undefined ? "" : req.body.assigned_to),
          status_text: (req.body.status_text === undefined ? "" : req.body.status_text),
          created_on: new Date(),
          updated_on: new Date(),
          open: true
        });
        console.log(newIssue);
        newIssue.save((err, data) => {
          if(err) return console.err(err);
        });
        res.json(objectWithoutKey(newIssue._doc, "project"));
      }
    })
    
    .put(async function (req, res){
      const project = req.params.project;
      if(req.body._id === undefined) {
        res.json({error: "missing _id"});
      } else {
        let update = populate(req.body, updateFields);
        if(Object.keys(update).length < 1) {
          console.log("fieldsError");
          res.json({error: "no update field(s) sent", _id: req.body._id});
        } else {
          update.updated_on = new Date();
          if(update.open === "true") update.open = true;
          if(update.open === "false") update.open = false;
          try {
            if(await Issue.findByIdAndUpdate(req.body._id, update) === null) {
              res.json({error: "could not update", _id: req.body._id});
            } else {
              res.json({result: "successfully updated", _id: req.body._id});
            }
          } catch {
            console.log("dbError");
            res.json({error: "could not update", _id: req.body._id});
          }
        }
      }
    })
    
    .delete(async function (req, res){
      let project = req.params.project;
      if(req.body._id === undefined) {
        res.json({error: "missing _id"});
      } else {
        try {
          if(await Issue.findById(req.body._id) === null) {
            res.json({error: "could not delete", _id: req.body._id});
          } else {
            await Issue.findByIdAndDelete(req.body._id);
            res.json({result: "successfully deleted", _id: req.body._id});
          }
        } catch {
          res.json({error: "could not delete", _id: req.body._id});
        }
      }
    });
    
};
