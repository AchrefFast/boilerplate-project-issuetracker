'use strict';
// Require the necessary collections from db.js
const mongoose = require('./db').mongoose;
const Project = require('./db').Project;
const Issue = require('./db').Issue;



module.exports = function (app) {

  app.route('/api/issues/:project')

    // The GET request to /api/issues/{projectname}
    .get(function (req, res) {
      // The name of the project
      let project = req.params.project;

      // The coming data from the client
      const q = req.query;
      // console.log('This is the raw data coming from the client \n: ', q);

      // Create an empty array that will hold the issue(s)
      let issues = [];
      // Try and find the Project with the corresponding project name coming from the client
      Project.findOne({ name: project }, function (err, doc) {
        // if the project does exist in the collection
        if (doc) {
          // Put all the issues of the found project inside the "issues" variable
          issues = doc.issues;

          if (err) res.send('Something went wrong');
          // Loop over all the keys of the recieved data and make a filter depending on each one(if it does exist).
          for (const pr in q) {
            // Filter the issues depending on the type of the data's keys.
            if (pr == 'open') {
              // We need to convert the value of the open property to a string in order to be able to compare it with the value of open property coming from the client(cause it's a string).
              // We can't compare boolean with string they should be both boolean or string to get a correct result.
              issues = issues.filter(elm => '' + elm[pr] == q[pr]);
            }
            // We have to convert both dates from the client and the database to milliseconds so that we can get the right result.
            if (pr == 'created_on' || pr == 'updated_on') {
              issues = issues.filter(elm => elm[pr].getTime() == Date.parse(q[pr]));
            }
            // Here we're comparing two string, the loose equality will be enough
            if (pr == 'issue_title' || pr == 'issue_text' || pr == 'created_by' || pr == 'assigned_to' || pr == 'status_text') {
              issues = issues.filter(elm => elm[pr] == q[pr]);
            }
            // To compare ObjectId with string we need first to convert it as well to string.
            if (pr == '_id') {
              issues = issues.filter(elm => '' + elm[pr] == '' + q[pr])
            }
          }
          // Send the issues 
          res.json(issues)
        }
        else {
          // if we couldn't find the Project in the collection
          console.log("Couldn't find the project");
          res.json([]);
        }
      });

    })



    .post(function (req, res) {
      let project = req.params.project;
      let data = req.body;
      let issue_object = {};

      // Check if the user did not enter the necessary fields
      for (const i in data) {
        if (i == 'issue_title' || i == 'issue_text' || i == 'created_by') {
          if (!data[i] || (/^\s$/).test(data[i])) {
            console.log("{ error: 'required field(s) missing' }");
            res.json({ error: 'required field(s) missing' });
            return;
          }
        }
      }
      // Use destructuring to get the corresponding values from the recieved data
      const { issue_title, issue_text, created_by } = data;
      let assigned_to = '';
      let status_text = '';
      // If the assigned_to or status_text fields aren't provided, assign to them an empty string
      if (data.assigned_to) {
        assigned_to = data.assigned_to;
      }
      if (data.status_text) {
        status_text = data.status_text;
      }
      // store all the recieved data inside an object
      issue_object = {
        issue_title: issue_title,
        issue_text: issue_text,
        created_by: created_by,
        assigned_to: assigned_to,
        status_text: status_text
      };
      // console.log(issue_object);

      // If one of the necessary fields doesn't exist throw an error message to the client
      if (!issue_text || !issue_title || !created_by) {
        res.json({ error: 'required field(s) missing' });
        return;
      }
      // Look for the project with the corresponding name provided in the request-uri
      Project.findOne({ name: project }, function (err, doc) {
        if (err) res.send('Something went wrong');

        // Create a new issue and save its _id inside the "_id" variable
        const issue = new Issue(issue_object);
        const _id = issue._id;
        // If the project isn't already exist in the "Project" collection then create a new project document.
        if (!doc) {
          const newProject = new Project({ name: project });
          // Add the created issue to the issues array of the project.
          newProject.issues.push(issue);
          newProject.save(function (err, p) {
            //console.log('we are going to search for this issue');

            const r = p.issues[p.issues.length - 1];
            //console.log(r);
            // Return the created issue to the client in json format
            res.json(r);
          });
        }
        // If the project already exist do the same work without creating new project document.
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
    // Handle a PUT request to '/api/issues/{projectname}
    .put(function (req, res) {
      let project = req.params.project;
      const data = req.body;
      let fields = false;

      // If the _id isn't provided, throw and erro 'missing _id' to the client
      if (!data._id) {
        // console.log("{ error: 'missing _id' }", data);
        res.json({ error: 'missing _id' });
        return;
      }
      // Check all the provided fields
      for (const i in data) {
        // console.log(i);
        // If the user provide an empty string as an _id the throw an error to the client 'missing _id'.
        if (i == '_id' && !data[i]) {
          // console.log("{ error: 'missing _id' }", data);
          res.json({ error: 'missing _id' });
          return;
        }
        else {
          // Check if there is at leat one field was provided.
          if (data[i] && i != '_id') {
            fields = true;
          }
        }
      }
      // Retrieve the project with the corresponsing name in the request-uri
      Project.findOne({ name: project }, function (err, doc) {
        if (err) res.json({ error: 'could not update', '_id': data._id });
        // If the project doesn't exist in the collection, throw an error to the client 'could not update'.
        if (!doc) {
          console.log("Couldn't find The specific Project", data);
          res.json({ error: 'could not update', '_id': data._id });
        }
        // When you find the project in the Project collection.
        else {
          //console.log("Project Found");
          // Look  inside the issues array of the project document for an issue with the corresponding _id that was provided by the client. 
          let issue = doc.issues.id(req.body._id);
          // If none of the fields was provide by the client then throw an error.
          if (!fields) {
            console.log('No update fields(s) send', data);
            res.json({ error: 'no update field(s) sent', '_id': data._id });
            return;
          }
          // If no issue with the corresponding _id was found inside the issues array of the project, then throw an error to the client.
          if (!issue) {
            console.log('No issue with the id ', data._id, 'was found \n', data);
            res.json({ error: 'could not update', '_id': data._id });
            return;
          }
          // If we found an issue with the corresponding _id =, then Update only the provided fields of that issue.
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
    // Handle the DELETE  request to '/api/issues/{projectname}
    .delete(function (req, res) {
      let project = req.params.project;
      // console.log(req.body);
      const _id = req.body._id;
      // If no error was provided by the user throw an error message to the client.
      if (!_id) {
        res.json({ error: 'missing _id' });
        return;
      }
      Project.findOne({ name: project }, function (err, doc) {
        if (err) res.json({ error: 'could not delete', '_id': _id });
        if (doc) {
          // Look for an issue with the corresponding _id inside the issues array of the project document.
          let issue = doc.issues.id(_id);
          // If no issue was found, then throw an error message to the client ' could not delete'.
          if (!issue) {
            res.json({ error: 'could not delete', '_id': _id });
            return;
          }
          // If the issue was found inside the issues array of the project document, then remove it.
          // And Send 'successfully deleted' with the id.
          else {
            issue.remove();
            doc.save();
            res.json({ result: 'successfully deleted', '_id': _id })
            return;
          }

        }
        // Throw an error if no project with corresponding name was found.
        else if (!doc) {
          res.json({ error: 'could not delete', '_id': _id });
          return;
        }
      })

    });

};
