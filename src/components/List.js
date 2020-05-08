import React, { Component } from 'react';
import database from '../services/database.js'
var moment = require('moment');

let firestore = database.firestore();

class List extends Component {

    constructor() {
        super();
        this.state = {
            blogs: null
        }
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

                this.setState({
                    blogs: blogs
                })
            })
    }

    renderBlogs() {
        let toReturn = [];
        let blogs = this.state.blogs;

        blogs.forEach(blog => {
            let date = moment(blog.createdAt);
            toReturn.push(
                <tr>
                    <td style={titleStyle}>{blog.title}</td>
                    <td style={contentStyle}>{blog.content}</td>
                    <td style={imageStyle}>{blog.image}</td>
                    <td style={createdStyle}>{date.format("MM/DD/YY, h:mm:ss a")}</td>
                </tr>
            )
        })

        return toReturn;
    }

    render() {
        return (
            <div style={{paddingLeft: 100, paddingRight: 100, alignItems: 'center', color: 'white', backgroundColor: 'white'}}>
                <h3 style={{color: 'red'}}>Admin Portal</h3>

                {this.state.blogs &&
                <table>
                    <tbody>
                    <tr>
                        <th style={titleHStyle}>Title</th>
                        <th style={contentHStyle}>Content</th>
                        <th style={imageHStyle}>Image</th>
                        <th style={createdHStyle}>Created At</th>
                    </tr>

                    {this.renderBlogs()}

                    </tbody>
                </table>
                }

            </div>
        )
    }

}

const titleHStyle = {
    width: '20%',
    fontWeight: 'bold'
}

const contentHStyle = {
    width: '50%',
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
}


const titleStyle = {
    width: '30%',
}

const contentStyle = {
    width: '50%'
}
const createdStyle = {
    width: '20%'
}

export default List;
