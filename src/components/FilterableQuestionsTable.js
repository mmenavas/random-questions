import React, { Component } from 'react';
import SearchBar from './SearchBar';
import QuestionsTable from './QuestionsTable';
import InsertBar from './InsertBar';
import * as firebase from 'firebase';

class FilterableQuestionsTable extends Component {

    constructor(props) {
        super(props);

        // Initialize Firebase
        const config = {
            apiKey: "AIzaSyC8gRjneI90v_IqgHFqd8WH0280mVGBf7k",
            authDomain: "random-questions.firebaseapp.com",
            databaseURL: "https://random-questions.firebaseio.com",
            storageBucket: "random-questions.appspot.com",
        };
        const fb = firebase
            .initializeApp(config)
            .database()
            .ref();

        this.state = {
            questions: [],
            filterText: '',
            database: fb
        };

        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.handleAddQuestionSubmit = this.handleAddQuestionSubmit.bind(this);

    }

    componentDidMount() {
        this.fetchQuestions();
    }

    fetchQuestions() {
        let query = this.state.database.child('Questions').orderByKey();
        let _this = this;
        this.serverRequest =
            query.once("value").then(function(snapshot) {
                let questions = [];
                snapshot.forEach(function(childSnapshot) {
                    let key = childSnapshot.key;
                    let childData = childSnapshot.val();
                    questions.push({
                        key: key,
                        question: childData['Question'],
                        author: childData['Author'],
                        category: childData['Category'],
                        votes:    childData['Votes']
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
            _this.fetchQuestions();  // Making a new call to the server is not efficient
        }).catch(function (error) {
            console.log(error);
        });
        
    }

    writeQuestion(question, category) {
        const newPostKey = this.state.database.child('Questions').push().key;
        var postData = {
            Question: question,
            Category: category,
            Author: "anonymous",
            votes: 0
        };

        let updates = {};
        updates['/Questions/' + newPostKey] = postData;
        //updates['/user-posts/' + uid + '/' + newPostKey] = postData;

        return firebase.database().ref().update(updates);
    }

    render() {
        return (
            <div>
                <SearchBar
                    filterText={this.state.filterText}
                    onUserInput={this.handleSearchInput}
                />
                <QuestionsTable
                    questions={this.state.questions}
                    filterText={this.state.filterText}
                />
                <InsertBar
                    onAddQuestionSubmit={this.handleAddQuestionSubmit}
                />
            </div>
        );
    }

}

export default FilterableQuestionsTable;
