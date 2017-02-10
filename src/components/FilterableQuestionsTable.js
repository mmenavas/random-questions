import React, { Component } from 'react';
import SearchBar from './SearchBar';
import QuestionsTable from './QuestionsTable';
import User from './User';
import * as firebase from 'firebase';
import * as firebaseui from 'firebaseui';
import '../css/Firebaseui.css';
import '../css/FilterableQuestionsTable.css';

class FilterableQuestionsTable extends Component {

    constructor(props) {
        super(props);

        // Initialize Firebase
        const config = {
            apiKey:        "AIzaSyC8gRjneI90v_IqgHFqd8WH0280mVGBf7k",
            authDomain:    "random-questions.firebaseapp.com",
            databaseURL:   "https://random-questions.firebaseio.com",
            storageBucket: "random-questions.appspot.com",
        };
        const fb = firebase
            .initializeApp(config)
            .database()
            .ref();

        this.state = {
            questions:  [],
            filterText: '',
            database:   fb,
            author:     '',
            email:      ''
        };

        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.handleAddQuestionSubmit = this.handleAddQuestionSubmit.bind(this);
        this.handleOnVote = this.handleOnVote.bind(this);
        this.handleSignOut = this.handleSignOut.bind(this);
    }

    componentDidMount() {
        let _this = this;
        this.fetchQuestions();

        // Check if user is logged in
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in.
                _this.setState({
                    author: user.displayName,
                    email: user.email
                });

            } else {
                // FirebaseUI config.
                const uiConfig = {
                    signInSuccessUrl: '/',
                    signInOptions: [
                        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                    ],
                    // Terms of service url.
                    tosUrl: ''
                };
                // Initialize the FirebaseUI Widget using Firebase.
                const ui = new firebaseui.auth.AuthUI(firebase.auth());
                // The start method will wait until the DOM is loaded.
                ui.start('#firebaseui-auth-container', uiConfig);
                _this.setState({
                    author: '',
                    email: ''
                });
            }
        }, function(error) {
            console.log(error);
        }).bind(this);

    }

    fetchQuestions() {
        let query = this.state.database.child('Questions').orderByChild('Votes');
        let _this = this;
        this.serverRequest =
            query.once("value").then(function(snapshot) {
                let questions = [];
                snapshot.forEach(function(childSnapshot) {
                    let key = childSnapshot.key;
                    let childData = childSnapshot.val();
                    questions.push({
                        key:      key,
                        question: childData['Question'],
                        author:   childData['Author'],
                        email:    childData['Email'],
                        category: childData['Category'],
                        votes:    childData['Votes'] * -1
                    });
                });
                _this.setState({questions: questions});
            });
    }

    componentWillUnmount() {
        this.serverRequest.abort();
    }

    handleSearchInput(filterText) {
        this.setState({
            filterText: filterText,
        });
    }

    handleAddQuestionSubmit(values) {
        let question = values['question'];
        let category = values['category'];
        let _this = this;

        this.writeQuestion(question, category).then(function(response) {
            _this.fetchQuestions();  // Todo: Making a new call to the server is not efficient
        }).catch(function (error) {
            console.log(error);
        });
        
    }

    writeQuestion(question, category) {
        const newPostKey = this.state.database.child('Questions').push().key;
        let author = 'Anonymous';
        let email = '';
        if (this.state.email) {
            author = this.state.author;
            email = this.state.email;
        }
        var postData = {
            Question: question,
            Category: category,
            Author: author,
            Email: email,
            Votes: 0
        };

        let updates = {};
        updates['/Questions/' + newPostKey] = postData;
        //updates['/user-posts/' + uid + '/' + newPostKey] = postData;

        return firebase.database().ref().update(updates);
    }

    handleOnVote(index, votes) {
        let _this = this;

        this.vote(index, votes).then(function(response) {
            _this.fetchQuestions();  // Todo: Making a new call to the server is not efficient
        }).catch(function (error) {
            console.log(error);
        });

    }

    vote(index, votes) {
        let updates = {};
        let currentQuestion = this.state.questions[index];
        var postData = {
            Question: currentQuestion.question,
            Category: currentQuestion.category,
            Author: currentQuestion.author,
            Email: currentQuestion.email,
            Votes: (currentQuestion.votes + votes) * -1
        };
        updates['/Questions/' + currentQuestion.key] = postData;

        return firebase.database().ref().update(updates);
    }

    handleSignOut() {
        firebase.auth().signOut();
        this.setState({
            author: '',
            email: ''
        });
    }

    render() {
        return (
            <div className="Random-Questions">
                <div className="Random-Questions--Header">
                    <div className="left">
                        <h1 className="Page-Title">Random Questions</h1>
                    </div>
                    <div className="right">
                        <SearchBar
                            filterText={this.state.filterText}
                            onUserInput={this.handleSearchInput}
                        />
                    </div>
                </div>
                <User
                    author={this.state.author}
                    email={this.state.email}
                    onSignOut={this.handleSignOut}
                    onAddQuestionSubmit={this.handleAddQuestionSubmit}
                />
                <QuestionsTable
                    email={this.state.email}
                    questions={this.state.questions}
                    filterText={this.state.filterText}
                    onVote={this.handleOnVote}
                />
            </div>
        );
    }

}

export default FilterableQuestionsTable;