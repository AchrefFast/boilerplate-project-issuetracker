const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', function (err) {
    console.log("Can't connect to the MongoDb database");
});
// mongoose.connection.once('open', function () {
//     console.log("Connected successufly to the database");
// });

const { Schema } = mongoose;

const issueSchema = new Schema({
    issue_title: { type: String, required: true },
    issue_text: { type: String, required: true },
    created_by: { type: String, required: true },
    assigned_to: String,
    status_text: String,
    open: { type: Boolean, default: true }
},
    { timestamps: { createdAt: 'created_on', updatedAt: 'updated_on' } }
);

const projectSchema = new Schema({
    name: { type: String, required: true },
    issues: [issueSchema]
});

const Project = mongoose.model('Project', projectSchema);
const Issue = mongoose.model('Issue', issueSchema);

module.exports.mongoose = mongoose;
module.exports.Project = Project;
module.exports.Issue = Issue;

