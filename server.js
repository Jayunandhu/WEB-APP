/*********************************************************************************
* WEB700 – Assignment 06
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Jaya Nandhini Kannan ID: 161496237 Date: 8/1/2024
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
app.get("/students", function (req, res) {
    if (req.query.course) {
        collegeData.getStudentsByCourse(req.query.course)
            .then(function (data) {
                if (data.length > 0) {
                    res.render("students", { students: data });
                } else {
                    res.render("students", { message: "no results" });
                }
            })
            .catch(function (err) {
                res.render("students", { message: "no results" });
            });
    } else {
        collegeData.getAllStudents()
            .then(function (data) {
                if (data.length > 0) {
                    res.render("students", { students: data });
                } else {
                    res.render("students", { message: "No results found" });
                }
            })
            .catch(function (err) {
                res.render("students", { message: "no results" });
            });
    }
});

// Define a route for the "/students/add" URL to serve the addStudent page
app.get('/students/add', (req, res) => {
    collegeData.getCourses()
        .then(courses => {
            res.render('addStudent', { courses: courses });
        })
        .catch(err => {
            console.error(err);
            res.render('addStudent', { courses: [] }); // Send an empty array if getCourses() fails
        });
});


// Define a route for the "/students/add" URL to serve the addStudent post request
app.post('/students/add', (req, res) => {
    let studentData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        addressStreet: req.body.addressStreet,
        addressCity: req.body.addressCity,
        addressProvince: req.body.addressProvince,
        TA: req.body.TA === 'on',
        status: req.body.status,
    };

    collegeData.addStudent(studentData).then(() => {
        res.redirect('/students');
    }).catch(err => {
        console.error(err);
        res.redirect('/students');
    });
});

// Define a route for the "/students/:num" URL to get a student by their number
app.get("/student/:studentNum", (req, res) => {
    // initalize an empty object to store the values
    let viewData = {};
    collegeData.getStudentsByNum(req.params.studentNum).then((data) => {
        if (data) {
            viewData.student = data; //store student data in the "viewData" object as "student"
        } else {
            viewData.student = null; // set student to null if none were returned
        }
    })
    .catch(() => {
        viewData.student = null; // set student to null if there was an error
    })
    .then(collegeData.getCourses)
    .then((data) => {
        viewData.courses = data; 
        for (let i = 0; i < viewData.courses.length; i++) {
            if (viewData.courses[i].courseId == viewData.student.course) {
            viewData.courses[i].selected = true;
            }
        }
    })
    .catch(() => {
        viewData.courses = []; // set courses to empty if there was an error
    })
    .then(() => {
        if (viewData.student == null) { 
            res.status(404).send("Student Not Found");
        } else {
            res.render("student", { viewData: viewData }); // render the "student" view
        }
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

app.get('/student/delete/:id', (req, res) => {
    collegeData.deleteStudent(req.params.id)
        .then(() => {
            res.redirect('/students');
        })
        .catch(err => {
            res.status(500).send("Unable to Remove Student / Student not found");
        });
});

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
            if (data === undefined) {
                res.status(404).send("Course Not Found");
            } else {
                res.render("course", { course: data[0] });
            }
        })
        .catch(err => {
            res.status(500).send("An error occurred while retrieving the course");
        });
});

app.get('/courses/add', (req, res) => {
    res.render("addCourse")
});

app.post('/courses/add', (req, res) => {
    collegeData.addCourse(req.body).then(() => {
        res.redirect('/courses');
    }).catch(err => {
        console.error(err);
        res.redirect('/courses');
    });
});

app.post('/course/update', (req, res) => {
    let courseId = parseInt(req.body.courseId, 10);

    if (isNaN(courseId)) {
        return res.status(400).send('Invalid input: courseId must be numbers');
    }

    const updatedCourse = {
        courseId: courseId,
        courseCode: req.body.courseCode,
        courseDescription: req.body.courseDescription
    };

    collegeData.updateCourse(updatedCourse)
        .then(() => {
            res.redirect('/courses');
        })
        .catch(err => {
            res.redirect('/courses');
        });
});

app.get('/course/delete/:id', (req, res) => {
    collegeData.deleteCourse(req.params.id)
        .then(() => {
            res.redirect('/courses');
        })
        .catch(err => {
            res.status(500).send("Unable to Remove Course / Course not found");
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