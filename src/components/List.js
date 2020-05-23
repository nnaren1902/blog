import React, { Component } from 'react';
import database from '../services/database.js'
import {storage} from '../services/database.js'
import Modal from 'react-modal';
import Loader from "react-loader-spinner";
import styles from '../styles/List.module.css'

let moment = require('moment');


let firestore = database.firestore();

const CATEGORIES = {
    hvt: 'History VS. Today',
    ge: 'General Election',
    p: 'Politics',
    si: 'Social Icons',
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
            modalOpen: false,
            modalTitle: '',
            modalContent: '',
            imageAsFile: null,
            edit: false,
            editBlog: null,
            editIndex: null,
            imageError: false,
            uploading: false,
            checkBoxes: {},
            checkboxError: false
        }
        this.publishToggle = this.publishToggle.bind(this);
        this.onEditClicked = this.onEditClicked.bind(this);
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
                    return new Date(a.createdAt) - new Date(b.createdAt);
                });

                this.setState({
                    blogs: blogs.reverse()
                })
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

    publishToggle(index) {
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


    }

    onEditClicked(index) {
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

    onNewModalPressed() {
        this.setCheckboxes();
        this.setState({
            modalOpen: true
        })
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
                <tr key={i}>
                    <td style={publishStyle}><img style={{height: 30, width: 30, cursor: 'pointer'}} src={imgSrc} onClick={() => this.publishToggle(i)}/></td>
                    <td style={titleStyle} onClick={() => this.onEditClicked(i)}>{blog.title}</td>
                    <td style={tagsStyle}>{tagStringArray.join()}</td>
                    <td style={contentStyle} onClick={() => this.onEditClicked(i)}>{blog.content}</td>
                    <td style={imageStyle} onClick={() => this.onEditClicked(i)}>{blog.imageName}</td>
                    <td style={createdStyle} onClick={() => this.onEditClicked(i)}>{date.format("MM/DD/YY, h:mm:ss a")}</td>
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

    renderModal() {
        return (
            <div>
                <p
                    onClick={() => this.setState({modalOpen: false, edit: false, modalTitle: '', modalContent: '', imageError: false})}
                    style={{position: 'absolute', right: 15, top: 5, cursor: 'pointer', fontSize: 26}}>
                    X
                </p>

                <h2 style={{textAlign: 'center'}}>New Entry</h2>

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


    render() {
        return (
            <div style={{paddingLeft: 50, paddingRight: 50, color: 'white', backgroundColor: 'white'}}>
                <h1 style={{color: 'red'}}>Admin Portal</h1>

                <button
                    onClick={this.onNewModalPressed.bind(this)}
                    type="button"
                    className={styles.addNewBtn}>
                    Add New Entry
                </button>


                {this.state.blogs &&
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
    textAlign: 'center'
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
