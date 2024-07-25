/*********************************************************************************
* WEB700 – Assignment 05
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Jaya Nandhini Kannan ID: 161496237 Date: 07/16/2024
*
* Online (Verce;) Link: https://web700-app-nine.vercel.app/
*
*********************************************************************************/
// Set the HTTP port to the value provided in the environment variable PORT or default to 8080
var HTTP_PORT = process.env.PORT || 8080;

// Import the Express framework
var express = require("express");

// Import the express-handlebars module
const exphbs = require('express-handlebars');

// Import the path module to handle file paths
const path = require('path');

// Create an instance of an Express application
var app = express();

app.use(express.urlencoded({extended: true}));

app.engine('.hbs', exphbs.engine({ 
    extname: '.hbs',
    helpers: {
        navLink: function(url, options){
            return '<li' +
            ((url == app.locals.activeRoute) ? ' class="nav-item active" ' : ' class="nav-item" ') +
            '><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
            return options.inverse(this);
            } else {
            return options.fn(this);
            }
        }
    }
}));

app.set('view engine', '.hbs');

app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(path.resolve(), 'public')));

// Import the collegeData module which contains data-related functions
const collegeData = require('./modules/collegeData');

app.use(function(req,res,next){
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    next();
});

// Define a route for the root URL ("/") to serve the home page
app.get("/", (req, res) => {
    res.render('home');
});

// Define a route for the "/about" URL to serve the about page
app.get("/about", (req, res) => {
    res.render('about');
});

// Define a route for the "/htmlDemo" URL to serve the HTML demo page
app.get("/htmlDemo", (req, res) => {
    res.render('htmlDemo');
});

// Define a route for the "/students" URL to get students data
app.get("/students", function(req, res) {
    // If a course query parameter is provided, get students by course
    if (req.query.course) {
        collegeData.getStudentsByCourse(req.query.course)
            .then((students) => {
                res.json(students);
            })
            .catch((err) => {
                res.json({ message: err });
            });
    } else {
        // Otherwise, get all students
        collegeData.getAllStudents()
            .then((data) => {   
                res.render("students", {students: data}); 
            })
            .catch((err) => {
                res.render("students", {message: "no results"});
            });
    }
});

// Define a route for the "/students/add" URL to serve the addStudent page
app.get('/students/add', (req, res) => {
    res.render('addStudent');
});

// Define a route for the "/students/add" URL to serve the addStudent post request
app.post('/students/add', (req, res) => {
    collegeData.addStudent(req.body).then(() => {
        res.redirect('/students');
    }).catch(err => {
        res.redirect('/students');
    });
});

// Define a route for the "/students/:num" URL to get a student by their number
app.get("/student/:num", function(req, res) {
    collegeData.getStudentsByNum(req.params.num)
        .then((data) => {
            res.render("student", {student: data[0]});
        })
        .catch((err) => {
            res.render("student", {message: "no results"});
        });
});

app.post('/student/update', (req, res) => {
    let studentNum = parseInt(req.body.studentNum, 10);
    let course = parseInt(req.body.course, 10);

    if (isNaN(studentNum) || isNaN(course)) {
        return res.status(400).send('Invalid input: studentNum and course must be numbers');
    }

    const updatedStudent = {
        studentNum: studentNum,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        addressStreet: req.body.addressStreet,
        addressCity: req.body.addressCity,
        addressProvince: req.body.addressProvince,
        TA: req.body.TA === 'on',
        status: req.body.status,
        course: course
    };

    collegeData.updateStudent(updatedStudent)
        .then(() => {
            res.redirect('/students');
        })
        .catch(err => {
            res.redirect('/students');
            // res.status(500).send("Unable to update student: " + err);
        });
});

// Define a route for the "/tas" URL to get data of teaching assistants (TAs)
// app.get("/tas", function(req, res)  {
//     collegeData.getTAs()
//         .then((tas) => {
//             res.json(tas);
//         })
//         .catch((err) => {
//             res.json({ message: "No results" });
//         });
// });

// Define a route for the "/courses" URL to get courses data
app.get('/courses', function(req, res)  {
    collegeData.getCourses().then(data => {
        res.render("courses", {courses: data});
    }).catch(err => {
        res.render("courses", {message: "no results"});
    });
});

app.get('/course/:id', (req, res) => {
    collegeData.getCourseById(req.params.id)
        .then(data => {
            res.render("course", {course: data[0]});
        })
        .catch(err => {
            res.render("course",{ message: "no results" });
        });
});

// Catch-all for 404 errors
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});
// Initialize the collegeData module and start the server on the specified port
collegeData.initialize()
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log("Server listening on port " + HTTP_PORT);
        });
    })
    .catch((err) => {
        console.error(err);
    });

module.exports = app;