import React, { Component } from 'react';
import database from '../services/database.js'
import {storage} from '../services/database.js'
import Modal from 'react-modal';
import Loader from "react-loader-spinner";
import { Bar } from 'react-chartjs-2';
import styles from '../styles/List.module.css'

let moment = require('moment');


let firestore = database.firestore();

const CATEGORIES = {
    hvt: 'History VS. Today',
    ge: 'General Election',
    p: 'Politics',
    c: 'Equality Now',
    c19: 'COVID-19',
}

const modalStyle = {
    overlay: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.44)'
    },
    content : {
        width: '75%',
        top                : '40%',
        left                  : '50%',
        right                 : 'auto',
        bottom                : 'auto',
        marginRight           : '-50%',
        transform             : 'translate(-50%, -50%)'
    }
};

class List extends Component {

    constructor() {
        super();
        this.state = {
            blogs: null,
            surveys: null,
            modalOpen: false,
            surveyResults: false,
            modalTitle: '',
            modalContent: '',
            imageAsFile: null,
            edit: false,
            editBlog: null,
            editIndex: null,
            imageError: false,
            uploading: false,
            checkBoxes: {},
            checkboxError: false,
            survey: false,
            surveyTitle: '',
            surveyQuestion: '',
            surveyOptionsLength: 2, //default
            surveyOptions: ['', ''],
            showSurveys: false,
            showBlogs: true
        }
        this.publishToggle = this.publishToggle.bind(this);
        this.uploadBlog = this.uploadBlog.bind(this);
        this.updateblog = this.updateblog.bind(this);
        this.setCheckboxes = this.setCheckboxes.bind(this);
    }

    componentDidMount() {
        firestore.collection('blogs').get()
            .then(docref => {
                let blogs = [];
                docref.forEach(doc => {
                    let data = doc.data();
                    data.id = doc.id;
                    blogs.push(data)
                })

                blogs.sort(function(a,b){
                    // Turn your strings into dates, and then subtract them
                    // to get a value that is either negative, positive, or zero.
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });

                this.setState({
                    blogs: blogs
                })
            })

    //    get surveys
        firestore.collection('surveys').get()
            .then(docref => {
                let surveys = [];
                docref.forEach(doc => {
                    let data = doc.data();
                    data.id = doc.id;
                    surveys.push(data)
                })

                surveys.sort(function(a,b){
                    // Turn your strings into dates, and then subtract them
                    // to get a value that is either negative, positive, or zero.
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });

                this.setState({
                    surveys: surveys
                })
            })
    }

    onNewSurveyPressed() {
        this.setState({
            modalOpen: true,
            survey: true
        })

    }

    setCheckboxes() {
        //set all checkboxes to unchecked for controlled vs uncontrolled problem
        let checkBoxes = {}
        Object.keys(CATEGORIES).forEach(cat => {
            checkBoxes[cat] = false
        })
        this.setState({
            checkBoxes: checkBoxes
        })
    }

    onModalEditPressed() {
        let checkBoxes = this.state.checkBoxes;
        let tags = [];
        Object.keys(checkBoxes).forEach(cat => {
            if(checkBoxes[cat])
                tags.push(cat)
        })

        if(tags.length === 0) {
            //atleast on tag shoudl be included
            this.setState({
                checkboxError: true
            })
            return
        }

        let title = this.state.modalTitle;
        let content = this.state.modalContent;

        if(!title || title.length === 0 || !content || content.length === 0)
            return;

        let editBlog = this.state.editBlog;
        editBlog.title = title;
        editBlog.content = content;
        editBlog.tags = tags;

        //if image updated
        if(this.state.imageEdited) {
            let imageAsFile = this.state.imageAsFile;

            if(!imageAsFile || imageAsFile === '' ) {
                this.setState({imageError: true})
                return;
            }
            let name = imageAsFile.name;
            let allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;

            if (!allowedExtensions.exec(name)) {
                console.log('invalid file type')
                this.setState({imageError: true})
                return false;
            }

            //upload iamge and update url
            const self = this;
            this.setState({uploading: true})
            const uploadTask = storage.ref(`/images/${imageAsFile.name}`).put(imageAsFile);
            uploadTask.on('state_changed',
                (snapShot) => {
                    //takes a snap shot of the process as it is happening
                }, (err) => {
                    //catches the errors
                    console.log('error', err)
                    self.setState({imageError: true})
                }, () => {
                    // gets the functions from storage refences the image storage in firebase by the children
                    // gets the download url then sets the image from firebase as the value for the imgUrl key:
                    storage.ref('images').child(imageAsFile.name).getDownloadURL()
                        .then(fireBaseUrl => {
                            console.log('image uploaded')
                            editBlog.imageUrl = fireBaseUrl;
                            editBlog.imageName = name;
                            self.updateblog(editBlog)
                        })
                })
        } else {
            this.updateblog(editBlog)
        }

    }

    updateblog(editBlog) {
        let blogs = this.state.blogs;
        firestore.collection('blogs').doc(editBlog.id).update(editBlog)
            .then(ref => {
                console.log('edited blog')
                blogs[this.state.editIndex] = editBlog;
                this.setState({imageEdited: false, imageError: false, modalOpen: false, blogs: blogs, editBlog: null, edit: false, editIndex: null, modalTitle: '', modalContent: '', uploading: false})
            }).catch(err => {
            console.log('error when editing blog entry', err)
        })
    }

    onModalSubmitPressed() {
        let checkBoxes = this.state.checkBoxes;
        let tags = [];
        Object.keys(checkBoxes).forEach(cat => {
            if(checkBoxes[cat])
                tags.push(cat)
        })

        if(tags.length === 0) {
            //atleast on tag shoudl be included
            this.setState({
                checkboxError: true
            })
            return
        }

        let title = this.state.modalTitle;
        let content = this.state.modalContent;
        let imageAsFile = this.state.imageAsFile;

        if(!imageAsFile || imageAsFile === '' ) {
            this.setState({imageError: true})
            return;
        }

        if(!title || title.length === 0 || !content || content.length === 0)
            return;


        let name = imageAsFile.name;
        let allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;

        if (!allowedExtensions.exec(name)) {
            console.log('invalid file type')
            this.setState({imageError: true})
            return false;
        } else {
            this.setState({
                imageError: false,
                uploading: true
            })
        }

        const self = this;
        const uploadTask = storage.ref(`/images/${imageAsFile.name}`).put(imageAsFile);
        uploadTask.on('state_changed',
            (snapShot) => {
                //takes a snap shot of the process as it is happening
            }, (err) => {
                //catches the errors
                console.log('error', err)
                self.setState({imageError: true})
            }, () => {
                // gets the functions from storage refences the image storage in firebase by the children
                // gets the download url then sets the image from firebase as the value for the imgUrl key:
                storage.ref('images').child(imageAsFile.name).getDownloadURL()
                    .then(fireBaseUrl => {
                        console.log('image uploaded')
                        let newObject = {
                            title: title,
                            content: content,
                            published: false,
                            imageUrl: fireBaseUrl,
                            imageName: name,
                            tags: tags,
                            createdAt: new Date().toISOString()
                        }
                        self.uploadBlog(newObject)
                    })
            })





    }

    uploadBlog(newObject) {
        let blogs = this.state.blogs;

        firestore.collection('blogs').add(newObject)
            .then(ref => {
                console.log('added new blog entry', ref.id)
                newObject.id = ref.id;
                blogs.unshift(newObject)
                this.setState({modalOpen: false, blogs: blogs, edit: false, modalTitle: '', modalContent: '', imageError: false, uploading: false})
            }).catch(err => {
            console.log('error when adding new blog entry', err)
        })
    }

    publishToggle(index, isBlogs) {

        if(isBlogs) {
            let blogs = this.state.blogs;
            let blog = blogs[index];

            let published = blog.published;
            blog.published = !published;

            firestore.collection('blogs').doc(blog.id).update({
                published: !published
            }).then(() => {
                this.setState({
                    blogs: blogs
                })
            })
        } else {
            let {surveys} = this.state;
            let survey = surveys[index];

            let published = survey.published;
            survey.published = !published;

            firestore.collection('surveys').doc(survey.id).update({
                published: !published
            }).then(() => {
                this.setState({
                    surveys: surveys
                })
            })
        }
    }

    onSurveyEditClicked(index) {
        let survey = this.state.surveys[index]
        this.setState({
            modalOpen: true,
            surveyResults: true,
            survey: true,
            selectedSurvey: survey
        })
    }

    onBlogEditClicked(index) {
        let blogs = this.state.blogs;
        let blog = blogs[index];

        let tags = blog.tags;
        let checkBoxes = {};
        Object.keys(CATEGORIES).forEach(cat => {
            checkBoxes[cat] = tags.includes(cat)
        })

        this.setState({
            modalOpen: true,
            edit: true,
            editBlog: blog,
            editIndex: index,
            modalTitle: blog.title,
            modalContent: blog.content,
            checkBoxes: checkBoxes
        })
    }

    handleImageAsFileUpload(e) {
        const image = e.target.files[0];
        this.setState({
            imageAsFile: image,
            imageError: false
        })
    }

    handleImageAsFileUploadEdit(e) {
        const image = e.target.files[0];
        this.setState({
            imageAsFile: image,
            imageError: false,
            imageEdited: true
        })
    }

    handleInputChange(event) {
        const target = event.target;
        const name = target.name;
        let checkBoxes = this.state.checkBoxes;
        checkBoxes[name] = target.checked;
        this.setState({
            checkBoxes: checkBoxes,
            checkboxError: false
        })
    }

    onNewBlogPressed() {
        this.setCheckboxes();
        this.setState({
            modalOpen: true
        })
    }

    renderSurveys() {
        let toReturn = [];
        let surveys = this.state.surveys;

        for(let i=0; i<surveys.length; i++) {
            let survey = surveys[i]
            let date = moment(survey.createdAt)
            let answers = survey.answers;
            let count = answers ? answers.length : 0
            let imgSrc = survey.published ? require('../assets/check.png') : require('../assets/check_n.png');
            toReturn.push(
                <tr key={survey.id}>
                    <td style={publishStyle}><img style={{height: 30, width: 30, cursor: 'pointer'}} src={imgSrc} onClick={() => this.publishToggle(i, false)}/></td>
                    <td style={questionStyle} onClick={() => this.onSurveyEditClicked(i)}>{survey.title}</td>
                    <td style={countStyle} onClick={() => this.onSurveyEditClicked(i)}>{count}</td>
                    <td style={createdStyle} onClick={() => this.onSurveyEditClicked(i)}>{date.format("MM/DD/YY, h:mm:ss a")}</td>
                </tr>
            )

        }

        return toReturn;
    }

    renderBlogs() {
        let toReturn = [];
        let blogs = this.state.blogs;

        for(let i=0; i<blogs.length; i++) {
            let blog = blogs[i]
            let date = moment(blog.createdAt);
            let imgSrc = blog.published ? require('../assets/check.png') : require('../assets/check_n.png');
            let tags = blog.tags;
            let tagStringArray = [];
            tags.forEach(tag => {
                tagStringArray.push(CATEGORIES[tag])
            })

            toReturn.push(
                <tr key={blog.id}>
                    <td style={publishStyle}><img style={{height: 30, width: 30, cursor: 'pointer'}} src={imgSrc} onClick={() => this.publishToggle(i, true)}/></td>
                    <td style={titleStyle} onClick={() => this.onBlogEditClicked(i)}>{blog.title}</td>
                    <td style={tagsStyle}>{tagStringArray.join()}</td>
                    <td style={contentStyle} onClick={() => this.onBlogEditClicked(i)}>{blog.content}</td>
                    <td style={imageStyle} onClick={() => this.onBlogEditClicked(i)}>{blog.imageName}</td>
                    <td style={createdStyle} onClick={() => this.onBlogEditClicked(i)}>{date.format("MM/DD/YY, h:mm:ss a")}</td>
                </tr>
            )
        }


        return toReturn;
    }


    getCheckboxes() {
        let toReturn = [];
        let i = 0;
        Object.keys(CATEGORIES).forEach(cat =>  {
            toReturn.push(
                <div key={i.toString()}
                     style={{display: 'flex', flexDirection: 'row', marginRight: 10}}>
                    <label>{CATEGORIES[cat]}: </label>
                    <input
                        name={cat}
                        type="checkbox"
                        checked={this.state.checkBoxes[cat]}
                        onChange={this.handleInputChange.bind(this)} />
                </div>
            )

            i = i + 1;
        })

        return toReturn;
    }

    renderChecks() {
        return (
            <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginTop: 20, marginBottom: 20}}>
                {this.getCheckboxes()}
            </div>
        )
    }

    renderBlogForm() {
        return (
            <div>
                <p
                    onClick={() => this.setState({modalOpen: false, edit: false, modalTitle: '', modalContent: '', imageError: false})}
                    style={{position: 'absolute', right: 15, top: 5, cursor: 'pointer', fontSize: 26}}>
                    X
                </p>

                <h2 style={{textAlign: 'center'}}>New Blog Entry</h2>

                <input value={this.state.modalTitle}
                       style={{borderRadius: 5, borderWidth: 1,color: 'black', borderStyle: 'solid', borderColor: 'gray', width: '75%', padding: 6, height: 40, marginTop: 20}}
                       onChange={(e) => this.setState({modalTitle: e.target.value})}
                       placeholder='Enter the title of blog....'
                       type='text'/>

                <textarea
                    rows="10"
                    placeholder='Enter the blog content....'
                    style={{display: 'block', width: '80%', padding: 6, color: 'black', borderRadius: 5, marginTop: 20, resize: 'none'}}
                    value={this.state.modalContent}
                    onChange={(e) => this.setState({modalContent: e.target.value})} />

                {this.renderChecks()}



                {this.state.edit ?
                    <div>
                        <div><p>Uploaded image name : {this.state.editBlog.imageName}</p></div>
                        <p style={{display: 'inline'}}>Upload Image:  </p>
                        <input
                            onChange={this.handleImageAsFileUploadEdit.bind(this)}
                            // allows you to reach into your file directory and upload image to the browser
                            type="file"
                        />

                        {
                            this.state.imageError &&
                            <p style={{fontSize: 14, color: 'red', marginTop: 5}}>Please upload a valid image</p>
                        }
                    </div>
                    :
                    <div>
                        <p style={{display: 'inline'}}>Upload Image:  </p>
                        <input
                            onChange={this.handleImageAsFileUpload.bind(this)}
                            // allows you to reach into your file directory and upload image to the browser
                            type="file"
                        />

                        {
                            this.state.imageError &&
                            <p style={{fontSize: 14, color: 'red', marginTop: 5}}>Please upload a valid image</p>
                        }
                    </div>
                }





                {this.state.uploading ?
                    <Loader
                        type="Bars"
                        color="#79CDCD"
                        height={200}
                        width={100}
                    />
                    :
                    this.state.edit ?
                        <button
                            onClick={this.onModalEditPressed.bind(this)}
                            type="button"
                            style={{marginTop: 20, borderWidth: 1, padding: 10, borderRadius: 5, backgroundColor: '#79CDCD', color: 'white', width: 200, cursor: 'pointer'}}>
                            Edit
                        </button>
                        :
                        <button
                            onClick={this.onModalSubmitPressed.bind(this)}
                            type="button"
                            style={{marginTop: 20, borderWidth: 1, padding: 10, borderRadius: 5, backgroundColor: '#79CDCD', color: 'white', width: 200, cursor: 'pointer'}}>
                            Submit
                        </button>
                }

                {this.state.checkboxError &&
                <p style={{color: 'red', fontSize: 16}}>Please select at least one category for the blog</p>
                }

            </div>
        )
    }

    surveyClosePressed() {
        this.setState({modalOpen: false, survey: false, surveyResults: false})
    }

    surveyOptionChanged(event, index) {
        let text = event.target.value;
        let surveyOptions = this.state.surveyOptions;
        surveyOptions[index] = text;
        this.setState({surveyOptions: surveyOptions})
    }

    onSurveySubmitPressed() {
        let title = this.state.surveyTitle;
        let question = this.state.surveyQuestion;
        let surveyOptions = this.state.surveyOptions;

        if(!title || title.length === 0 )
            return

        if(!question || question.length === 0 )
            return

        let flag = false
        surveyOptions.forEach(option => {
            if(option.length === 0)
                flag = true
        })

        if(flag)
            return

        let toWrite = {
            title: title,
            question: question,
            options: surveyOptions,
            createdAt: new Date().toISOString(),
            published: false
        }

        let surveys = this.state.surveys;

        firestore.collection('surveys').add(toWrite)
            .then(docRef =>  {
                toWrite.id = docRef.id;
                surveys.unshift(toWrite);
                this.setState({modalOpen: false, surveys: surveys, survey: false, surveyOptionsLength: 2, surveyOptions: ["", ""]})
                window.alert("Survey created. Publish from the list now!");
            }).catch(err => {
                console.log('Something went wrong when adding survey', err)
                window.alert('try again')
        })
    }

    onAddMoreOptionsPressed() {
        let currentLength = this.state.surveyOptionsLength
        let currentSurveyOptions = this.state.surveyOptions;
        currentSurveyOptions.push('')

        this.setState({
            surveyOptions: currentSurveyOptions,
            surveyOptionsLength: currentLength + 1
        })
    }

    onDeleteSurveyOption(index) {
        let currentLength = this.state.surveyOptionsLength
        let currentSurveyOptions = this.state.surveyOptions;
        currentSurveyOptions.splice(index, 1) //remove one element

        this.setState({
            surveyOptions: currentSurveyOptions,
            surveyOptionsLength: currentLength - 1
        })
    }

    onTabClicked(index) {
        switch(index) {
            case 0: this.setState({showBlogs: true, showSurveys: false})
                return;
            case 1: this.setState({showSurveys: true, showBlogs: false})
                return;
        }
    }

    renderSurveyOptions() {
        let toReturn = [];

        for(let i=0; i<this.state.surveyOptionsLength; i++) {
            toReturn.push(
                <div key={i.toString()} style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                    <input
                        value={this.state.surveyOptions[i]}
                        className={styles.surveyOption}
                        onChange={(e) => this.surveyOptionChanged(e, i)}
                        placeholder={'Enter option ' + (i+1) +'....'}
                        type='text'/>
                    {
                        this.state.surveyOptionsLength >= 3 &&
                        <img
                            onClick={() => this.onDeleteSurveyOption(i)}
                            style={{height: 30, width: 30, marginLeft: 12}}
                            src={require('../assets/delete.png')}/>
                    }

                </div>
            )
        }

        if(this.state.surveyOptionsLength < 5) {
            toReturn.push(
                <p
                    key={'unique'}
                    onClick={this.onAddMoreOptionsPressed.bind(this)}
                    style={{color: 'blue', textDecoration: 'underline', cursor: 'pointer'}}
                >
                    Add more +
                </p>
            )

        }

        return toReturn;
    }

    renderCreateSurveyForm() {
        return (
            <div>
                <p
                    onClick={() => this.surveyClosePressed()}
                    style={{position: 'absolute', right: 15, top: 5, cursor: 'pointer', fontSize: 26}}>
                    X
                </p>

                <h2 style={{textAlign: 'center'}}>New Survey</h2>

                <input value={this.state.surveyTitle}
                       style={{borderRadius: 5, borderWidth: 1,color: 'black', borderStyle: 'solid', borderColor: 'gray', width: '75%', padding: 6, height: 60, marginTop: 20}}
                       onChange={(e) => this.setState({surveyTitle: e.target.value})}
                       placeholder='Enter the title....'
                       type='text'/>

                <input value={this.state.surveyQuestion}
                       style={{borderRadius: 5, borderWidth: 1,color: 'black', borderStyle: 'solid', borderColor: 'gray', width: '75%', padding: 6, height: 60, marginTop: 20}}
                       onChange={(e) => this.setState({surveyQuestion: e.target.value})}
                       placeholder='Enter the question....'
                       type='text'/>

                <div style={{width: '90%', padding: 10, marginTop: 30}}>
                    {this.renderSurveyOptions()}
                </div>


                <button
                    onClick={this.onSurveySubmitPressed.bind(this)}
                    type="button"
                    style={{marginTop: 20, borderWidth: 1, padding: 10, borderRadius: 5, backgroundColor: '#79CDCD', color: 'white', width: 200, cursor: 'pointer'}}>
                    Submit
                </button>

            </div>
        )
    }

    renderSurveyResults() {
        let {selectedSurvey} = this.state
        let answers = selectedSurvey.answers || [];
        let chartData = [];
        let chartLabels = [];

        let options = selectedSurvey.options;
        for(let i=0; i<options.length; i++) {
            chartLabels[i] = options[i];
            chartData[i] = 0
        }

        let count;
        for(let i=0; i<answers.length; i++) {
            let answer = answers[i]; // answer is the index of the option
            count = chartData[answer]
            chartData[answer] = count + 1
        }

        return (
            <div>
                <p
                    onClick={() => this.surveyClosePressed()}
                    style={{position: 'absolute', right: 15, top: 5, cursor: 'pointer', fontSize: 26}}>
                    X
                </p>

                <h2 style={{textAlign: 'center', color: 'red'}}>Survey Results</h2>

                <div>
                    <h3>{selectedSurvey.title}</h3>
                    <p style={{maxHeight: 140, overflow: 'scroll'}}>{selectedSurvey.question}</p>
                </div>

                <div style={{height: 300}}>
                    <Bar
                        data={{
                            labels: chartLabels,
                            datasets: [{
                                label: '# of Votes',
                                data: chartData,
                            }]
                        }}
                        options={{
                            maintainAspectRatio: false,
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        beginAtZero: true
                                    }
                                }]
                            }
                        }}
                        width={100}
                        height={50}
                    />
                </div>
            </div>
        )
    }

    renderSurveyForm() {
        if(this.state.surveyResults)
            return this.renderSurveyResults()
        else
            return this.renderCreateSurveyForm()
    }

    renderModal() {
        if(this.state.survey) {
            return this.renderSurveyForm()
        } else {
            return this.renderBlogForm()
        }
    }


    render() {
        return (
            <div style={{paddingLeft: 50, paddingRight: 50, color: 'white', backgroundColor: 'white'}}>
                <h1 style={{color: 'red'}}>Admin Portal</h1>

                <div style={{display: 'flex', flexDirection: 'row'}}>
                    <button
                        onClick={this.onNewBlogPressed.bind(this)}
                        type="button"
                        className={styles.addNewBtn}>
                        Add New Blog
                    </button>

                    <button
                        onClick={this.onNewSurveyPressed.bind(this)}
                        type="button"
                        className={styles.addNewBtn}>
                        Add New Survey
                    </button>


                </div>

                {/*tabbar*/}
                <div className={styles.tabWrapper}>
                    <div
                        style={{
                            width: '25%',
                            borderBottomWidth: 3,
                            borderBottomColor: '#79CDCD',
                            borderStyle: this.state.showBlogs ? 'solid': null,
                            marginRight: 40
                        }}>
                        <p
                            onClick={() => this.onTabClicked(0)}
                            style={{color: 'black', fontWeight: 'bold', cursor: 'pointer', fontSize: 22}}>Blogs</p>
                    </div>
                    <div
                        style={{
                            width: '25%',
                            borderBottomWidth: 3,
                            borderBottomColor: '#79CDCD',
                            borderStyle: this.state.showSurveys ? 'solid': null,
                            marginLeft: 40
                        }}>
                        <p
                            onClick={() => this.onTabClicked(1)}
                            style={{color: 'black', fontWeight: 'bold', cursor: 'pointer', fontSize: 22}}>Surveys</p>
                    </div>
                </div>


                {this.state.showBlogs && this.state.blogs &&
                <table>
                    <tbody>
                    <tr>
                        <th style={publishHStyle}>Published</th>
                        <th style={titleHStyle}>Title</th>
                        <th style={tagsHStyle}>Tags</th>
                        <th style={contentHStyle}>Content</th>
                        <th style={imageHStyle}>Image</th>
                        <th style={createdHStyle}>Created At</th>
                    </tr>

                    {this.renderBlogs()}

                    </tbody>
                </table>
                }

                {this.state.showSurveys && this.state.surveys &&
                <table>
                    <tbody>
                    <tr>
                        <th style={publishHStyle}>Published</th>
                        <th style={questionHStyle}>Title</th>
                        <th style={countHStyle}>Total Responses</th>
                        <th style={createdHStyle}>Created At</th>
                    </tr>

                    {this.renderSurveys()}

                    </tbody>
                </table>
                }


                <Modal
                    ariaHideApp={false}
                    isOpen={this.state.modalOpen}
                    style={modalStyle}
                    contentLabel="Add New Entry">
                    {this.renderModal()}
                </Modal>


            </div>
        )
    }

}

const titleHStyle = {
    width: '20%',
    fontWeight: 'bold'
}

const publishHStyle = {
    width: '10%',
    fontWeight: 'bold'
}


const contentHStyle = {
    width: '30%',
    fontWeight: 'bold'
}


const tagsHStyle = {
    width: '15%',
    fontWeight: 'bold'
}

const createdHStyle = {
    width: '15%',
    fontWeight: 'bold'
}

const questionHStyle = {
    width: '45%',
    fontWeight: 'bold'
}


const countHStyle = {
    width: '30%',
    fontWeight: 'bold'
}

const questionStyle = {
    width: '45%',
    cursor: 'pointer'
}

const countStyle = {
    width: '30%',
    cursor: 'pointer'
}

const imageHStyle = {
    width: '10%',
    fontWeight: 'bold'
}

const imageStyle = {
    width: '10%',
    cursor: 'pointer'
}

const publishStyle = {
    width: '10%',
    textAlign: 'center',
    cursor: 'pointer'
}


const titleStyle = {
    width: '20%',
    cursor: 'pointer'
}

const tagsStyle = {
    width: '15%',
}


const contentStyle = {
    width: '30%',
    cursor: 'pointer'
}
const createdStyle = {
    width: '15%',
    cursor: 'pointer'
}

export default List;
