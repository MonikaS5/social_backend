// server.js

const express = require('express');
const dotenv = require('dotenv');

const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
	origin:'https://delicate-sable-1cf433.netlify.app'
}));

app.use((req, res, next)=>{
	res.set('Cache-control', 'no-store');
	next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/');
	},
	filename: function (req, file, cb) {
		cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
	}
});

const upload = multer({ storage: storage });

const uri = process.env.DB_CONNECT;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
	console.log("Connected to MongoDB");
}).catch((error) => {
	console.error("Error connecting MongoDB", error)
});


const postSchema = new mongoose.Schema({
	title: String,
	content: String,
	file: String,
	likes: { type: Number, default: 0 },
	dislikes: { type: Number, default: 0 },
	comments: [{ text: String }],
});

const Post = mongoose.model('Post', postSchema);

app.use(bodyParser.json());

app.get('/api/posts', async (req, res) => {
	try {
		const posts = await Post.find();
		res.json(posts);
	} catch (error) {
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

app.post('/api/posts', upload.single('file'), async (req, res) => {
	try {
		const { title, content } = req.body;
		const file = req.file ? req.file.filename : undefined;

		if (!title || !content) {
			return res.status(400).json({ error: 'Title and content are required fields' });
		}

		const post = new Post({ title, content, file });
		await post.save();
		res.status(201).json(post);
	} catch (error) {
		console.error('Error creating post:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

app.post('/api/posts/like/:postId', async (req, res) => {
	try {
		const postId = req.params.postId;
		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: 'Post not found' });
		}

		post.likes += 1;
		await post.save();

		res.json(post);
	} catch (error) {
		console.error('Error liking post:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});
//Put route for updating post with new data
app.put('/api/posts/:postId', async (req, res) => {
	try {
		const updatedPost = await Post.findByIdAndUpdate(
			req.params.postId,
			req.body,
			{ new: true }
		);
		res.json(updatedPost);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});


//Delete route for deleting post with specified id
app.delete('/api/posts/:postId', async (req, res) => {
	try {
		await Post.findByIdAndDelete(req.params.postId);
		res.json({ message: 'Post deleted' });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});




app.post('/api/posts/dislike/:postId', async (req, res) => {
	try {
		const postId = req.params.postId;
		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: 'Post not found' });
		}

		post.dislikes += 1;
		await post.save();

		res.json(post);
	} catch (error) {
		console.error('Error disliking post:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

app.post('/api/posts/comment/:postId', async (req, res) => {
	try {
		const postId = req.params.postId;
		const { text } = req.body;
		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: 'Post not found' });
		}

		post.comments.push({ text });
		await post.save();

		res.json(post);
	} catch (error) {
		console.error('Error adding comment:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});




app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});





