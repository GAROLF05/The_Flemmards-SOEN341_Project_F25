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

### Bijoy
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
- time spent : 2.5 h 

### Hesham Rabie
- Conceptualized and detailed the ideas for:
  - US.13 - US.14
- Helped organize and assign tasks in GitHub Issues.
  
### Elliot Boismartel
- Transcribed US.08 to US.12, and US.15 to Github issues.
- Detailed US.15 and listed tasks for US.15.
- Detailed tasks for US.10 and US.11

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
- Proofread GitHub repo
- time spent: 2 h

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

Time spent working : 48h

### Bijoy Sengupta


### Omar Dbaa


### Hesham Rabie

  
### Elliot Boismartel


### Mostafa Maraie


### Curtis Moxebo


### Nihit Patel
- Documented and formatted the **Meeting Minutes 1**, **Meeting Minutes 2**, **Meeting Minutes 3**, **Meeting Minutes 4** for Sprint 2.
- Implemented functionalities for user registration, sign up and loging. (userController.js & users.js) in the backend.
- Implemented the middleware for authenticating users (auth.js) in the backend.
- Setup TheFlemmardsTeam@gmail.com email and app password for nodemailer.
- Implemented email confirmation with ticket details for when a user registers for an event (inside registrationController.js) in the backend.
- Assigned Risks and Priorities to user stories 11-17.

Time Spent: 13h
