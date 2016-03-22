Topics = new Mongo.Collection("topics");
Posts = new Mongo.Collection("posts");

if (Meteor.isClient) {
  Meteor.subscribe("topics");
  Meteor.subscribe("posts");

  Template.topicList.helpers({
    topics: function() {
      return Topics.find({}, {sort: {createdAt: -1}});
    }
  });

  Template.topicList.events({
    "click #new-topic-submit": function (event) {
      event.preventDefault();
      var form = $(event.target).parent('form');
      var data = form.serializeArray();

      Meteor.call("addTopic", data[0]['value'], data[1]['value']);
      form.trigger("reset");

      return false;
    }
  });

  Template.topicItem.events({
    "click .delete": function() {
      Meteor.call("deleteTopic", this._id);
    },
    "click .topic-item": function() {
      window.location = "/topics/" + this._id;
    }
  });

  Template.topicItem.helpers({
    displayTopicDate: function(id, createdAt) {
      function dateDisplayString(dateObj) {
        if (dateObj.toDateString() === new Date().toDateString()) return "Today";
        return dateObj.toLocaleDateString();
      };

      var latestPost = Posts.find({topicId: id}, {limit: 1}, {sort: {createdAt: -1}}).fetch();
      if (latestPost.length > 0) return dateDisplayString(latestPost[0].createdAt);
      return dateDisplayString(createdAt);
    },

    numberOfPosts: function(id) {
      var numPosts = Posts.find({topicId: id}).count();
      return numPosts + " post" + (numPosts === 1 ? "" : "s")
    }
  })

  Template.showTopic.helpers({
    posts: function() {
      return Posts.find({topicId: this._id});
    }
  });

  Template.showTopic.events({
    "submit .new-post": function(event) {
      var text = event.target.post.value;
      text = $($.parseHTML(text)).text();
      Meteor.call("addPost", text, this._id);
      event.target.post.value = "";
      return false;
    }
  });

  Template.postItem.helpers({
    displayPostDate: function(date) {
      if (date.toDateString() === new Date().toDateString()) return date.toLocaleTimeString();
      return date.toLocaleDateString();
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
  Meteor.publish("topics", function() {
    return Topics.find();
  });
  Meteor.publish("posts", function(topicId) {
    // TODO: only return posts for a topic
    return Posts.find();
  })
}

Meteor.methods({
  checkAuthorization: function(){
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
  },

  addTopic: function(title, description) {
    checkAuthorization();

    Topics.insert({
      title: title,
      path: "/topics/",
      owner: Meteor.userId(),
      username: Meteor.user().username,
      description: description,
      createdAt: new Date()
    });
  },

  deleteTopic: function(topicId) {
    Topics.remove(topicId);
  },

  addPost: function(text, topicId) {
    checkAuthorization();

    Posts.insert({
      text: text,
      path: "/topics/" + topicId + "/post/",
      owner: Meteor.userId(),
      username: Meteor.user().username,
      createdAt: new Date(),
      topicId: topicId
    });
  },

  deletePost: function(postId) {
    Posts.remove(postId);
  }
});

Router.configure({
  layoutTemplate: 'ApplicationLayout'
});

Router.route('/', function() {
  this.render('topicList');
})

Router.route('/topics/:_id', function() {
  var topic = Topics.findOne({_id: this.params._id});
  this.render('ShowTopic', {data: topic});
});
