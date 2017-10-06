const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const session = require('express-session')
const moment = require('moment')
const path = require('path')
const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({secret: 'thisissecret'}))
app.use(express.static(path.resolve(__dirname, 'static')))
app.set('views', path.resolve(__dirname, 'views'))
app.set('view engine', 'ejs')


mongoose.connect('mongodb://localhost/wolves')

let Schema = mongoose.Schema
let PostSchema = new mongoose.Schema({
    name: { type: String, required: true, minlength: 4},
    text: { type: String, required: true }, 
    comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}]
   }, { timestamps: true });
mongoose.model('Post', PostSchema)
var Post = mongoose.model('Post')
let CommentSchema = new mongoose.Schema({
    _post: {type: Schema.Types.ObjectId, ref: 'Post'},
    name: { type: String, required: true, minlength: 4},
    text: { type: String, required: true },
}, {timestamps: true});
mongoose.model('Comment', CommentSchema)
var Comment = mongoose.model('Comment')

app.get('/', (req, res) => {
    Post.find({})
    .populate('comments')
    .exec((err, post) => {
        res.render('index', {posts:post, moment:moment, errors:req.session.errors, comment: {id: req.params.id, error: req.session.com_errors}})
    })
})

app.post('/posts', (req, res) => {
    console.log("post data: " + req.body)
    var post = new Post({name: req.body.name, text: req.body.message})
    post.save((err) => {
        if(err){
            console.log(err)
            req.session.errors = post.errors
            console.log('something went wrong')
            res.redirect('/')
        }
        else {
            req.session.destroy()
            console.log('successfully added a post!')
            res.redirect('/')
        }
    })
})

app.post('/posts/:id', function (req, res){
    console.log(req.body)
    Post.findOne({_id: req.params.id}, function(err, post){
        // data from form on the front end
        var comment = new Comment({name: req.body.name, text: req.body.message});
        //  set the reference like this:
        comment._post = post._id;
        console.log(comment)
        // now save both to the DB
        post.comments.push(comment);
        comment.save(function(err){
            console.log(err)
            if(err){
                req.session.id = req.params.id
                req.session.com_errors = comment.errors
                res.redirect('/')
            }
            else{
                post.save(function(err){
                    req.session.destroy()
                    console.log('Success!')
                    res.redirect('/');
                 });
            }
         });
    });
 });


app.listen(8000, () => {
    console.log("listening on port 8000")
})