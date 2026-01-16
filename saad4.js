// Mock data
let users = JSON.parse(localStorage.getItem('users')) || [];
let posts = JSON.parse(localStorage.getItem('posts')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let notifications = JSON.parse(localStorage.getItem('notifications')) || [];

// WebSocket simulation (use Socket.IO server for real-time)
const socket = io(); // Connect to server (run server.js)

socket.on('newPost', (post) => {
    posts.push(post);
    updateFeed();
    addNotification(`New post from ${post.author}`);
});

socket.on('newLike', (data) => {
    addNotification(`${data.user} liked your post`);
});

socket.on('newComment', (data) => {
    addNotification(`${data.user} commented on your post`);
});

socket.on('friendRequest', (data) => {
    addNotification(`${data.from} sent you a friend request`);
});

// Auth functions
function register() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    if (users.find(u => u.username === username)) {
        alert('Username taken');
        return;
    }
    const user = { id: Date.now(), username, email, bio: '', privacy: 'public', friends: [], avatar: 'https://via.placeholder.com/150' };
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    loginUser(user);
}

function login() {
    const username = document.getElementById('loginUsername').value;
    const user = users.find(u => u.username === username);
    if (user) loginUser(user);
    else alert('User not found');
}

function loginUser(user) {
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    document.getElementById('authSection').style.display = 'none';
    showSection('feed');
    updateUI();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    location.reload();
}

// UI functions
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById(section + 'Section').style.display = 'block';
    updateUI();
}

function updateUI() {
    if (!currentUser) return;
    updateFeed();
    updateProfile();
    updateFriends();
    updateNotifications();
}

function createPost() {
    const content = document.getElementById('postContent').value;
    const image = document.getElementById('postImage').files[0];
    const privacy = document.getElementById('postPrivacy').value;
    if (!content && !image) return;
    const post = {
        id: Date.now(),
        author: currentUser.username,
        content,
        image: image ? URL.createObjectURL(image) : null,
        privacy,
        likes: [],
        comments: [],
        timestamp: new Date()
    };
    posts.push(post);
    localStorage.setItem('posts', JSON.stringify(posts));
    socket.emit('newPost', post); // Simulate real-time
    updateFeed();
    document.getElementById('postContent').value = '';
}

function updateFeed() {
    const feed = document.getElementById('feed');
    feed.innerHTML = posts.filter(p => p.privacy === 'public' || currentUser.friends.includes(p.author)).map(p => `
        <div class="post">
            <strong>${p.author}</strong> <small>${p.timestamp.toLocaleString()}</small>
            <p>${p.content}</p>
            ${p.image ? `<img src="${p.image}" alt="Post image">` : ''}
            <button class="btn btn-sm btn-outline-primary" onclick="likePost(${p.id})">Like (${p.likes.length})</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="toggleComments(${p.id})">Comments (${p.comments.length})</button>
            <div id="comments-${p.id}" style="display: none;">
                <input type="text" id="commentInput-${p.id}" placeholder="Add comment" class="form-control mt-2">
                <button class="btn btn-sm btn-primary mt-1" onclick="addComment(${p.id})">Comment</button>
                ${p.comments.map(c => `<div class="comment"><strong>${c.user}:</strong> ${c.text}</div>`).join('')}
            </div>
        </div>
    `).join('');
}

function likePost(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post.likes.includes(currentUser.username)) {
        post.likes.push(currentUser.username);
        socket.emit('newLike', { postId, user: currentUser.username });
    }
    localStorage.setItem('posts', JSON.stringify(posts));
    updateFeed();
}

function toggleComments(postId) {
    const commentsDiv = document.getElementById(`comments-${postId}`);
    commentsDiv.style.display = commentsDiv.style.display === 'none' ? 'block' : 'none';
}

function addComment(postId) {
    const input = document.getElementById(`commentInput-${postId}`);
    const text = input.value;
    if (!text) return;
    const post = posts.find(p => p.id === postId);
    post.comments.push({ user: currentUser.username, text });
    socket.emit('newComment', { postId, user: currentUser.username });
    localStorage.setItem('posts', JSON.stringify(posts));
    updateFeed();
}

function updateProfile() {
    document.getElementById('profileBio').value = currentUser.bio;
    document.getElementById('profilePrivacy').value = currentUser.privacy;
    document.getElementById('profileAvatar').src = currentUser.avatar;
    const userPosts = posts.filter(p => p.author === currentUser.username);
    document.getElementById('userPosts').innerHTML = userPosts.map(p => `<div class="post">${p.content}</div>`).join('');
}

function updateAvatar() {
    const file = document.getElementById('avatarUpload').files[0];
    if (file) {
        currentUser.avatar = URL.createObjectURL(file);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateProfile();
    }
}

function updateProfile() {
    currentUser.bio = document.getElementById('profileBio').value;
    currentUser.privacy = document.getElementById('profilePrivacy').value;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('users', JSON.stringify(users));
}

function searchUsers() {
    const query = document.getElementById('friendSearch').value.toLowerCase();
    const results = users.filter(u => u.username.toLowerCase().includes(query) && u.id !== currentUser.id);
    document.getElementById('userList').innerHTML = results.map(u => `
        <div>${u.username} <button class="btn btn-sm btn-primary" onclick="sendFriendRequest(${u.id})">Add Friend</button></div>
    `).join('');
}

function sendFriendRequest(toId) {
    const toUser = users.find(u => u.id === toId);
    if (!toUser.requests) toUser.requests = [];
    toUser.requests.push(currentUser.id);
    socket.emit('friendRequest', { from: currentUser.username, to: toUser.username });
    localStorage.setItem('users', JSON.stringify(users));
}

function updateFriends() {
    const requests = currentUser.requests || [];
    document.getElementById('friendRequests').innerHTML = requests.map(id => {
        const fromUser = users.find(u => u.id === id);
        return `<div>${fromUser.username} <button class="btn btn-sm btn-success" onclick="acceptFriend(${id})">Accept</button> <button class="btn btn-sm btn-danger" onclick="rejectFriend(${id})">Reject</button></div>`;
    }).join('');
    document.getElementById('friendsList').innerHTML = currentUser.friends.map(id => {
        const friend = users.find(u => u.id === id);
        return `<div>${friend.username}</div>`;
    }).join('');
}

function acceptFriend(id) {
    currentUser.friends.push(id);
    currentUser.requests = currentUser.requests.filter(r => r !== id);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateFriends();
}

function rejectFriend(id) {
    currentUser.requests = currentUser.requests.filter(r => r !== id);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateFriends();
}

function addNotification(message) {
    notifications.push({ message, timestamp: new Date() });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotifications();
}

function updateNotifications() {
    document.getElementById('notifications').innerHTML = notifications.map(n => `<div>${n.message} <small>${n.timestamp.toLocaleString()}</small></div>`).join('');
}