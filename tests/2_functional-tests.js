const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const mongoose = require('../routes/db').mongoose;
const Project = require('../routes/db').Project;
const Issue = require('../routes/db').Issue;



chai.use(chaiHttp);

suite('Functional Tests', function () {
    test('Create an issue with every field: POST request to /api/issues/{project}', function (done) {
        chai.request(server)
            .post('/api/issues/test3')
            .type('form')
            .send({
                'issue_title': 'Test',
                'issue_text': 'Testing an issue form',
                'created_by': 'Achref',
                'assigned_to': 'Achref',
                'status_text': 'Text UT'
            })
            .end(function (err, res) {
                if (err) done(err);
                assert.equal(res.body.issue_title, 'Test');
                assert.equal(res.body.issue_text, 'Testing an issue form');
                assert.equal(res.body.created_by, 'Achref');
                assert.equal(res.body.assigned_to, 'Achref');
                assert.equal(res.body.status_text, 'Text UT');
                assert.isTrue(res.body.open);
                done();
            })
    })

    test('Create an issue with only required fields: POST request to /api/issues/{project}', function (done) {
        chai.request(server)
            .post('/api/issues/test3')
            .type('form')
            .send({
                'issue_title': 'Test',
                'issue_text': 'Testing an issue form',
                'created_by': 'Achref'

            })
            .end(function (err, res) {
                if (err) done(err);
                //console.log(res);
                assert.equal(res.body.issue_title, 'Test');
                assert.equal(res.body.issue_text, 'Testing an issue form');
                assert.equal(res.body.created_by, 'Achref');
                assert.equal(res.body.assigned_to, '');
                assert.equal(res.body.status_text, '');
                assert.isTrue(res.body.open);
                done();
            })
    })


    test('Create an issue with missing required fields: POST request to /api/issues/{project}', function (done) {
        chai.request(server)
            .post('/api/issues/test3')
            .type('form')
            .send({
                assigne_to: 'something'

            })
            .end(function (err, res) {
                if (err) done(err);
                // console.log(res);
                assert.equal(res.body.error, 'required field(s) missing')
                done();
            })
    })

    test('View issues on a project: GET request to /api/issues/{project}', function (done) {

        Project.findOne({ name: 'test4' }, function (err, doc) {
            if (err) done(err);
            const issue = new Issue({
                'issue_title': 'Test',
                'issue_text': 'Testing an issue form',
                'created_by': 'Achref',
                'assigned_to': 'Achref',
                'status_text': 'Text UT'
            });
            const _id = issue._id;
            doc.issues.push(issue);
            doc.save(function (err, project) {
                if (err) done(err);

                chai.request(server)
                    .get('/api/issues/test4')
                    .end(function (err, res) {
                        if (err) done(err);
                        const last_object = res.body[res.body.length - 1];
                        assert.equal(last_object._id, _id);
                        done();

                    })
            })
        })




    })


    test('View issues on a project with one filter: GET request to /api/issues/{project}', function (done) {

        Project.findOne({ name: 'test4' }, function (err, doc) {
            if (err) done(err);
            const issue = new Issue({
                'issue_title': 'Test',
                'issue_text': 'Testing an issue form',
                'created_by': 'Achref',
                'assigned_to': 'Achref',
                'status_text': 'Text UT'
            });
            const _id = issue._id;
            doc.issues.push(issue);
            doc.save(function (err, project) {
                if (err) done(err);

                chai.request(server)
                    .get('/api/issues/test4')
                    .query({ '_id': '' + _id })
                    .end(function (err, res) {
                        if (err) done(err);
                        // console.log(res.body);
                        const object = res.body[0];
                        // console.log(res);
                        assert.equal(object._id, _id);
                        done();

                    })
            })
        })
    })

    test('View issues on a project with multiple filters: GET request to /api/issues/{project}', function (done) {

        Project.findOne({ name: 'test4' }, function (err, doc) {
            if (err) done(err);
            const issue = new Issue({
                'issue_title': 'Test',
                'issue_text': 'Testing an issue form',
                'created_by': 'Achref',
                'assigned_to': 'Achref',
                'status_text': 'Text UT'
            });
            const _id = issue._id;
            doc.issues.push(issue);
            doc.save(function (err, project) {
                if (err) done(err);

                chai.request(server)
                    .get('/api/issues/test4')
                    .query({ 'issue_title': 'Test', 'created_by': 'Achref' })
                    .end(function (err, res) {
                        if (err) done(err);
                        const object = res.body;
                        // console.log(object);
                        object.map(elm => {
                            assert.equal(elm.issue_title, 'Test');
                            assert.equal(elm.created_by, 'Achref');
                        })
                        done();

                    })
            })
        })

    })

    test('Update one field on an issue: PUT request to /api/issues/{project}', function (done) {

        Project.findOne({ name: 'test4' }, function (err, doc) {
            if (err) done(err);
            const issue = new Issue({
                'issue_title': 'Test',
                'issue_text': 'Testing an issue form',
                'created_by': 'Achref',
                'assigned_to': 'Achref',
                'status_text': 'Text UT'
            });
            const _id = issue._id;
            doc.issues.push(issue);
            doc.save(function (err, project) {
                if (err) done(err);

                chai.request(server)
                    .put('/api/issues/test4')
                    .send({ '_id': _id, 'issue_title': 'New Title' })
                    .end(function (err, res) {
                        if (err) done(err);
                        const object = res.body;

                        assert.equal(object.result, 'successfully updated')
                        done();

                    })
            })
        })

    })

    test('Update multiple fields on an issue: PUT request to /api/issues/{project}', function (done) {

        Project.findOne({ name: 'test4' }, function (err, doc) {
            if (err) done(err);
            const issue = new Issue({
                'issue_title': 'Test',
                'issue_text': 'Testing an issue form',
                'created_by': 'Achref',
                'assigned_to': 'Achref',
                'status_text': 'Text UT'
            });
            const _id = issue._id;
            doc.issues.push(issue);
            doc.save(function (err, project) {
                if (err) done(err);

                chai.request(server)
                    .put('/api/issues/test4')
                    .send({ '_id': _id, 'issue_title': 'New Title', 'issue_text': 'We are trying to test update with many fields', 'created_by': 'A new user' })
                    .end(function (err, res) {
                        if (err) done(err);
                        const object = res.body;

                        assert.equal(object.result, 'successfully updated')
                        done();

                    })
            })
        })

    })

    test('Update an issue with missing _id: PUT request to /api/issues/{project}', function (done) {

        Project.findOne({ name: 'test4' }, function (err, doc) {
            if (err) done(err);
            const issue = new Issue({
                'issue_title': 'Test',
                'issue_text': 'Testing an issue form',
                'created_by': 'Achref',
                'assigned_to': 'Achref',
                'status_text': 'Text UT'
            });
            const _id = issue._id;
            doc.issues.push(issue);
            doc.save(function (err, project) {
                if (err) done(err);

                chai.request(server)
                    .put('/api/issues/test4')
                    .send({ 'issue_text': 'We are trying to test update with many fields', 'created_by': 'A new user' })
                    .end(function (err, res) {
                        if (err) done(err);
                        const object = res.body;

                        assert.equal(object.error, 'missing _id')
                        done();

                    })
            })
        })

    })

    test('Update an issue with no fields to update: PUT request to /api/issues/{project}', function (done) {

        Project.findOne({ name: 'test4' }, function (err, doc) {
            if (err) done(err);
            const issue = new Issue({
                'issue_title': 'Test',
                'issue_text': 'Testing an issue form',
                'created_by': 'Achref',
                'assigned_to': 'Achref',
                'status_text': 'Text UT'
            });
            const _id = issue._id;
            doc.issues.push(issue);
            doc.save(function (err, project) {
                if (err) done(err);

                chai.request(server)
                    .put('/api/issues/test4')
                    .send({ '_id': _id })
                    .end(function (err, res) {
                        if (err) done(err);
                        const object = res.body;
                        assert.equal(object.error, 'no update field(s) sent')
                        done();

                    })
            })
        })

    })

    test('Update an issue with an invalid _id: PUT request to /api/issues/{project}', function (done) {

        Project.findOne({ name: 'test4' }, function (err, doc) {
            if (err) done(err);
            const issue = new Issue({
                'issue_title': 'Test',
                'issue_text': 'Testing an issue form',
                'created_by': 'Achref',
                'assigned_to': 'Achref',
                'status_text': 'Text UT'
            });
            const _id = issue._id;
            doc.issues.push(issue);
            doc.save(function (err, project) {
                if (err) done(err);

                chai.request(server)
                    .put('/api/issues/test4')
                    .send({ '_id': 'invalid _id', 'issue_title': 'Wrong ID' })
                    .end(function (err, res) {
                        if (err) done(err);
                        const object = res.body;
                        assert.equal(object.error, 'could not update')
                        done();

                    })
            })
        })

    })

    test('Delete an issue: DELETE request to /api/issues/{project}', function (done) {

        Project.findOne({ name: 'test4' }, function (err, doc) {
            if (err) done(err);
            const issue = new Issue({
                'issue_title': 'Test',
                'issue_text': 'Testing an issue form',
                'created_by': 'Achref',
                'assigned_to': 'Achref',
                'status_text': 'Text UT'
            });
            const _id = issue._id;
            doc.issues.push(issue);
            doc.save(function (err, project) {
                if (err) done(err);

                chai.request(server)
                    .delete('/api/issues/test4')
                    .send({ '_id': _id })
                    .end(function (err, res) {
                        if (err) done(err);
                        const object = res.body;
                        assert.equal(object.result, 'successfully deleted')
                        done();

                    })
            })
        })

    })


    test('Delete an issue with an invalid _id: DELETE request to /api/issues/{project}', function (done) {

        Project.findOne({ name: 'test4' }, function (err, doc) {
            if (err) done(err);
            const issue = new Issue({
                'issue_title': 'Test',
                'issue_text': 'Testing an issue form',
                'created_by': 'Achref',
                'assigned_to': 'Achref',
                'status_text': 'Text UT'
            });
            const _id = issue._id;
            doc.issues.push(issue);
            doc.save(function (err, project) {
                if (err) done(err);

                chai.request(server)
                    .delete('/api/issues/test4')
                    .send({ '_id': 'invalid ID' })
                    .end(function (err, res) {
                        if (err) done(err);
                        const object = res.body;
                        assert.equal(object.error, 'could not delete')
                        done();

                    })
            })
        })

    })


    test('Delete an issue with missing _id: DELETE request to /api/issues/{project}', function (done) {

        Project.findOne({ name: 'test4' }, function (err, doc) {
            if (err) done(err);
            const issue = new Issue({
                'issue_title': 'Test',
                'issue_text': 'Testing an issue form',
                'created_by': 'Achref',
                'assigned_to': 'Achref',
                'status_text': 'Text UT'
            });
            const _id = issue._id;
            doc.issues.push(issue);
            doc.save(function (err, project) {
                if (err) done(err);

                chai.request(server)
                    .delete('/api/issues/test4')
                    .send({})
                    .end(function (err, res) {
                        if (err) done(err);
                        const object = res.body;
                        // console.log(object);
                        assert.equal(object.error, 'missing _id')
                        done();

                    })
            })
        })

    })

});
