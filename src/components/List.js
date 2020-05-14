import React, { Component } from 'react';
import database from '../services/database.js'
import Modal from 'react-modal';
import styles from '../styles/List.module.css'

let moment = require('moment');

let firestore = database.firestore();

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
        top                : '30%',
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
            edit: false,
            editBlog: null,
            editIndex: null
        }

        this.publishToggle = this.publishToggle.bind(this);
        this.onEditClicked = this.onEditClicked.bind(this);
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

    onModalEditPressed() {
        let title = this.state.modalTitle;
        let content = this.state.modalContent;

        if(!title || title.length === 0 || !content || content.length === 0)
            return;


        let blogs = this.state.blogs;

        let editBlog = this.state.editBlog;
        editBlog.title = title;
        editBlog.content = content;

        firestore.collection('blogs').doc(editBlog.id).update(editBlog)
            .then(ref => {
                console.log('edited blog')
                blogs[this.state.editIndex] = editBlog;
                this.setState({modalOpen: false, blogs: blogs, editBlog: null, edit: false, editIndex: null, modalTitle: '', modalContent: ''})
            }).catch(err => {
            console.log('error when editing blog entry', err)
        })
    }

    onModalSubmitPressed() {
        let title = this.state.modalTitle;
        let content = this.state.modalContent;

        if(!title || title.length === 0 || !content || content.length === 0)
            return;

        let newObject = {
            title: title,
            content: content,
            published: false,
            createdAt: new Date().toISOString()
        }

        let blogs = this.state.blogs;

        firestore.collection('blogs').add(newObject)
            .then(ref => {
                console.log('added new blog entry', ref.id)
                newObject.id = ref.id;
                blogs.unshift(newObject)
                this.setState({modalOpen: false, blogs: blogs, edit: false, modalTitle: '', modalContent: ''})
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

        this.setState({
            modalOpen: true,
            edit: true,
            editBlog: blog,
            editIndex: index,
            modalTitle: blog.title,
            modalContent: blog.content
        })
    }

    renderBlogs() {
        let toReturn = [];
        let blogs = this.state.blogs;

        for(let i=0; i<blogs.length; i++) {
            let blog = blogs[i]
            let date = moment(blog.createdAt);
            let imgSrc = blog.published ? require('../assets/check.png') : require('../assets/check_n.png');
            toReturn.push(
                <tr key={i}>
                    <td style={publishStyle}><img style={{height: 30, width: 30, cursor: 'pointer'}} src={imgSrc} onClick={() => this.publishToggle(i)}/></td>
                    <td style={titleStyle} onClick={() => this.onEditClicked(i)}>{blog.title}</td>
                    <td style={contentStyle} onClick={() => this.onEditClicked(i)}>{blog.content}</td>
                    <td style={imageStyle} onClick={() => this.onEditClicked(i)}>{blog.image}</td>
                    <td style={createdStyle} onClick={() => this.onEditClicked(i)}>{date.format("MM/DD/YY, h:mm:ss a")}</td>
                </tr>
            )
        }


        return toReturn;
    }

    renderModal() {
        return (
            <div>
                <p
                    onClick={() => this.setState({modalOpen: false, edit: false, modalTitle: '', modalContent: ''})}
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

                {
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
            </div>
        )
    }


    render() {
        return (
            <div style={{paddingLeft: 50, paddingRight: 50, color: 'white', backgroundColor: 'white'}}>
                <h1 style={{color: 'red'}}>Admin Portal</h1>

                <button
                    onClick={() => this.setState({modalOpen: true})}
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

const publishStyle = {
    width: '10%',
    textAlign: 'center'
}

const contentHStyle = {
    width: '40%',
    fontWeight: 'bold'
}

const createdHStyle = {
    width: '20%',
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


const titleStyle = {
    width: '30%',
    cursor: 'pointer'
}

const contentStyle = {
    width: '50%',
    cursor: 'pointer'
}
const createdStyle = {
    width: '20%',
    cursor: 'pointer'
}

export default List;
