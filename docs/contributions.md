# Team Contributions

This document highlights the individual work done by each member of **The Flemmards**.

---

## Sprint 1

### Nameer Hanif
- Wrote initial draft of all user stories.
- Conceptualized and detailed the ideas for:
  - US.01 - US.04
  - US.XX - Recommendation of Events
  - US.XX - Wishlist Feature
  - US.XX - Student Account
  - US.XX - Event Cancellation
- Made minor fixes (spelling, title, assigning tasks to user stories, etc...) concerning the issues.

### Bijoy Sengupta
- Conceptualized and detailed the ideas for:
  - US.16
  - US XX (Third one point under Student - Event Discovery)
- Brainstormed about how to implement review systems for events
- Helped organize and assign tasks in GitHub Issues.

### Omar Dbaa
- Conceptualized and detailed the ideas for:
  - US.11 - US.12
- Reviewed assigned User Stories and identified tasks that are frontend responsibilities.
- Helped organize and assign tasks in GitHub Issues.

### Hesham Rabie
- Conceptualized and detailed the ideas for:
  - US.13 - US.14
- Helped organize and assign tasks in GitHub Issues.
  
### Elliot Boismartel
- Conceptualized and detailed the ideas for:
  - US.09, US.10, US.15
- Helped organize and assign tasks in GitHub Issues.

### Mostafa Maraie
- Conceptualized and detailed the ideas for:
  - US.17
- Helped organize and assign tasks in GitHub Issues.

### Curtis Moxebo
- Conceptualized and detailed the ideas for:
  - US.8
- Helped organize and assign tasks in GitHub Issues.

### Nihit Patel
- Wrote and formatted the **Meeting Minutes 1** and **Meeting Minutes 2**.  
- Created and documented the **README file**, including the tech stack, project description, objectives, and core features.
- Created and documented the contributions page.
- Time Spent: 2h

---

## Sprint 2

### Nameer Hanif
- Did most of the backend implementation of US.02, US.03 and US.04 (except email sending)
  - Worked on the QR code implementation, database updates, and all of its edge cases
  - Worked on the Tickets implementation, database updates, and all of its edge cases
  - Worked on the Events implementation, database updates, and all of its edge cases
  - Worked on the `.ics` generation implementation using the `Events` database
  - Worked on the Registration implementation (including capacity and waitlist handling, database updates, and all of its edge cases
- Set up the initial backend workflow of this project with the following folders : `config/`, `controllers/`, `middlewares/`, `models/`, `routes/`, `tests/`, `utils/`.
- Set up the MongoDB database on MongoDB Compass, and MongoDB Atlas. Invited the others to the database so they can use it for their own testing and implementation. Set up the `URI` and `PASSWORD` in a `.env` file.
- Fully implemented and coded the following `controller/` files : `calendarController.js`, `eventController.js`, `registrationController.js`, `ticketController.js`
- Fully implemented and coded the following DB `models/` files : `Administrators.js`, `Event.js`, `Organization.js`, `Registrations.js`, `Ticket.js`, `User.js`
- Fully implemented and coded the following `routes/` files : `calendar.js`, `events.js`, `registrations.js`, `tickets.js`
- Fully implemented and coded the following `utils/` files : `authHelpers.js`
- Fully implemented and coded the following `config/` files : `database.js`
- Assigned Risks and Priorities to user stories 1-4, 8-10.

Time spent working : 48h

### Bijoy Sengupta


### Omar Dbaa


### Hesham Rabie

  
### Elliot Boismartel
- Finished most of the implementation for US.XX1
  - Finished task 2,3,4 and finished designing the sorting algorithm for comment filtering

Time spent: 4h

### Mostafa Maraie


### Curtis Moxebo
- Setup the frontend project using React, vite and tailwind
- Design and implement the login and signup page
- Design and implement the student page
- Design and implement the organizer page

Time spent: 48h

### Nihit Patel
- Documented and formatted the **Meeting Minutes 1**, **Meeting Minutes 2**, **Meeting Minutes 3**, **Meeting Minutes 4** for Sprint 2.
- Implemented functionalities for user registration, sign up and loging. (userController.js & users.js) in the backend.
- Implemented the middleware for authenticating users (auth.js) in the backend.
- Setup TheFlemmardsTeam@gmail.com email and app password for nodemailer.
- Implemented email confirmation with ticket details for when a user registers for an event (inside registrationController.js) in the backend.
- Assigned Risks and Priorities to user stories 11-17.

Time Spent: 13h

---

## Sprint 3

### Nameer Hanif
- Did the frontend-backend implementation of US.01 (Event Discovery)
  - Fetching all events, displaying them in the main page
  - Added a default image for all events without a picture
  - Implemented a score system algorithm for featured events so it automatically changes based on the score
 
- Did the frontend-backend implementation of US.08 (Event Creation)
  - Modified the form to include an image input
  - Modified date to be start at and end at fields
  - Added a "details" modal in the Event Cards to show the details of the events

- Did the frontend-backend implementation of US.11 (Tools - Track attendance)
  - Implemented a "Export to CSV" button below the "Details" and "Analytics" buttons

- Did the frontend-backend implementation of US.13 (Platform Oversight)
  - Implemented the "Approve Organizers" feature
    - In the organizer's page, after signing up as an organizer, it "freezes" the page so the organizer c/n do anything until approval
    - In the administrator's page, implemented a moderation button with a moderation modal and card showing organizer account details, alongside details of organization, with an "approve"/"reject" organizer button with reason for rejection
    - Implemented a "re-approve" organizer button for future Support implementation

- Refined US.15 (Administrator Analytics) by adding more statistics from the `getDashboardStats` API in `adminController.js`

- Did the frontend-backend implementation of US.17 (Management)
  - Implemented a moderation button, with a moderation modal and card showing the organization's details, and all the events, alongside the number of registrations with a "Suspend"/"Unsuspend" Organization button
  - Implemented frontend handling of the organization suspension in the organizer's page, and in the student's event page by not allowing them to register to the event of a suspended organization

Total time spent : 36h


### Bijoy Sengupta


### Omar Dbaa


### Hesham Rabie

  
### Elliot Boismartel
- Finished implementing US.XX1 Comment Filtering
  - Finished task 1 to collect and store all event review comments in MongoDB
  - Finished task.EXTRA to finalize comment filtering
- Implemented US.06 Event Analytics
  - Finished task 2 to calculate total tickets issued, remaining capacity, and attendance rates per event
- Implemented US.11 Administrator Analytics
  - Finished task 1 to count events, tickets, and participation
  - Finished task 2 to fetch number of events, total tickets issued, and participation data through API endpoint
  - Finished task 3 to format the data into JSON and send it to frontend

Total time spent: 15h

### Mostafa Maraie


### Curtis Moxebo


### Nihit Patel
- Wrote and formatted all the **Meeting Minutes 1-4** for Sprint 3.  
- Created the block diagram describing the system's architecture.
- Defined a list of acceptance tests for every user story.

Time Spent: 8h
