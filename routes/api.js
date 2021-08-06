'use strict';

const mongoose = require('./db').mongoose;
const Project = require('./db').Project;
const Issue = require('./db').Issue;



module.exports = function (app) {

  app.route('/api/issues/:project')

    .get(function (req, res) {
      let project = req.params.project;

      const q = req.query;
      // console.log('This is the raw data coming from the client \n: ', q);
      let issues = [];
      Project.findOne({ name: project }, function (err, doc) {
        if (doc) {
          issues = doc.issues;

          if (err) res.send('Something went wrong');
          for (const pr in q) {
            if (pr == 'open') {
              issues = issues.filter(elm => '' + elm[pr] == q[pr]);
            }
            if (pr == 'created_on' || pr == 'updated_on') {
              issues = issues.filter(elm => elm[pr].getTime() == Date.parse(q[pr]));
            }
            if (pr == 'issue_title' || pr == 'issue_text' || pr == 'created_by' || pr == 'assigned_to' || pr == 'status_text') {
              issues = issues.filter(elm => elm[pr] == q[pr]);
            }
            if (pr == '_id') {
              issues = issues.filter(elm => '' + elm[pr] == '' + q[pr])
            }
          }
          // if (q.open) {

          //   issues = issues.filter(elm => {
          //     console.log(elm.open == q.open);
          //     return ('' + elm.open) == q.open
          //   });
          //   console.log(issues);
          // }
          // if (q.issue_title) {
          //   console.log('In issue_title')
          //   issues = issues.filter(elm => elm.issue_title == q.issue_title);
          // }
          // if (q.issue_text) {
          //   issues = issues.filter(elm => elm.issue_text == q.issue_text);
          // }
          // if (q.created_by) {
          //   issues = issues.filter(elm => elm.created_by == q.created_by);
          // }
          // if (q.assigned_to) {
          //   issues = issues.filter(elm => elm.assigned_to == q.assigned_to);
          // }
          // if (q.status_text) {
          //   issues = issues.filter(elm => elm.status_text == q.status_text);
          // }
          // if (q._id) {
          //   issues = issues.filter(elm => elm._id == q._id);
          // }
          // if (q.created_on) {
          //   issues = issues.filter(elm => ((elm.created_on.getTime())) == Date.parse(q.created_on));
          // }
          // if (q.updated_on) {

          //   issues = issues.filter(elm => {
          //     // console.log((elm.updated_on.getTime()), Date.parse(q.updated_on));
          //     // console.log((elm.updated_on + '') == q.updated_on)
          //     return ((elm.updated_on.getTime())) == Date.parse(q.updated_on);
          //   });
          // }
          res.json(issues)
        }
        else {
          console.log("Couldn't find the project");
          res.json([]);
        }
      });

    })



    .post(function (req, res) {
      let project = req.params.project;
      let data = req.body;
      let issue_object = {};
      for (const i in data) {
        if (i == 'issue_title' || i == 'issue_text' || i == 'created_by') {
          if (!data[i] || (/^\s$/).test(data[i])) {
            console.log("{ error: 'required field(s) missing' }");
            res.json({ error: 'required field(s) missing' });
            return;
          }
        }
      }
      // if (!data.issue_title || !data.issue_text || !data.created_by) {
      //   console.log("{ error: 'required field(s) missing' }");
      //   res.json({ error: 'required field(s) missing' });
      // }

      const { issue_title, issue_text, created_by } = data;
      let assigned_to = '';
      let status_text = '';
      if (data.assigned_to) {
        assigned_to = data.assigned_to;
      }
      if (data.status_text) {
        status_text = data.status_text;
      }

      issue_object = {
        issue_title: issue_title,
        issue_text: issue_text,
        created_by: created_by,
        assigned_to: assigned_to,
        status_text: status_text
      };
      // console.log(issue_object);

      if (!issue_text || !issue_title || !created_by) {
        res.json({ error: 'required field(s) missing' });
        return;
      }

      Project.findOne({ name: project }, function (err, doc) {
        if (err) res.send('Something went wrong');


        const issue = new Issue(issue_object);
        const _id = issue._id;

        if (!doc) {
          const newProject = new Project({ name: project });
          newProject.issues.push(issue);
          newProject.save(function (err, p) {
            //console.log('we are going to search for this issue');
            const r = p.issues[p.issues.length - 1];
            //console.log(r);
            res.json(r);
          });
        }
        else {
          doc.issues.push(issue);
          doc.save(function (err, p) {
            if (err) res.send('Something went wrong');
            // console.log('we are going to search for this issue');
            const r = p.issues[p.issues.length - 1];
            //console.log(r);
            res.json(r);

          });
        }

      });

    })

    .put(function (req, res) {
      let project = req.params.project;
      const data = req.body;
      console.log('This is the raw data: ', req.body);
      let fields = false;
      if (!data._id) {
        console.log("{ error: 'missing _id' }", data);
        res.json({ error: 'missing _id' });
        return;
      }
      for (const i in data) {
        // console.log(i);
        if (i == '_id' && !data[i]) {
          console.log("{ error: 'missing _id' }", data);
          res.json({ error: 'missing _id' });
          return;
        }
        else {
          if (data[i] && i != '_id') {
            fields = true;
          }
        }
      }

      Project.findOne({ name: project }, function (err, doc) {
        if (err) res.json({ error: 'could not update', '_id': data._id });
        if (!doc) {
          console.log("Couldn't find The specific Project", data);
          res.json({ error: 'could not update', '_id': data._id });
        }
        else {
          //console.log("Project Found");
          let issue = doc.issues.id(req.body._id);
          if (!fields) {
            console.log('No update fields(s) send', data);
            res.json({ error: 'no update field(s) sent', '_id': data._id });
            return;
          }
          if (!issue) {
            console.log('No issue with the id ', data._id, 'was found \n', data);
            res.json({ error: 'could not update', '_id': data._id });
            return;
          }
          for (const i in data) {
            if (i != '_id' && data[i]) {
              issue[i] = data[i];
            }
          }
          doc.save();
          res.json({ result: 'successfully updated', _id: data._id });
        }
      })

    })

    .delete(function (req, res) {
      let project = req.params.project;
      // console.log(req.body);
      const _id = req.body._id;
      if (!_id) {
        res.json({ error: 'missing _id' });
        return;
      }
      Project.findOne({ name: project }, function (err, doc) {
        if (err) res.json({ error: 'could not delete', '_id': _id });
        if (doc) {
          let issue = doc.issues.id(_id);
          if (!issue) {
            res.json({ error: 'could not delete', '_id': _id });
            return;
          }
          else {
            issue.remove();
            doc.save();
            res.json({ result: 'successfully deleted', '_id': _id })
            return;
          }

        }
        else if (!doc) {
          res.json({ error: 'could not delete', '_id': _id });
          return;
        }
      })

    });

};
