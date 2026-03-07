const mongoose = require('mongoose');
const User = require('./models/User');
const Organization = require('./models/Organization');
const Club = require('./models/Club');
const Event = require('./models/Event');
const Registration = require('./models/Registration');
const Comment = require('./models/Comment');
const Announcement = require('./models/Announcement');
const ClubRequest = require('./models/ClubRequest');
const Credential = require('./models/Credential');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin:admin123@cluster0.b5kri5x.mongodb.net/campus-connect?retryWrites=true&w=majority";

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Drop all collections to clear stale indexes
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
        await mongoose.connection.db.dropCollection(col.name);
    }
    console.log('Dropped all collections.');


    // ── Users ──
    const users = await User.insertMany([
        { _id: new mongoose.Types.ObjectId(), name: 'Platform Admin', email: 'admin@mitra.dev', role: 'super_admin', clubIds: [], interests: [], createdAt: '2024-01-01T00:00:00Z' },
        { _id: new mongoose.Types.ObjectId(), name: 'Dr. Mehta', email: 'mehta@bvm.edu.in', role: 'org_admin', organizationId: 'org1', clubIds: [], interests: [], createdAt: '2024-01-01T00:00:00Z' },
        { _id: new mongoose.Types.ObjectId(), name: 'Hardik Bandhiya', email: 'hardik@bvm.edu.in', role: 'club_admin', organizationId: 'org1', clubIds: [], profilePhoto: '', rollNumber: '20BECE001', year: 3, phone: '+91 98765 43210', interests: ['Cloud Computing', 'Web Dev', 'AI/ML'], createdAt: '2024-08-01T00:00:00Z' },
        { _id: new mongoose.Types.ObjectId(), name: 'Dhavalkumar Prajapati', email: 'dhaval@bvm.edu.in', role: 'club_admin', organizationId: 'org1', clubIds: [], rollNumber: '20BECE034', year: 3, phone: '+91 98765 11111', interests: ['CP', 'DSA'], createdAt: '2024-02-01T00:00:00Z' },
        { _id: new mongoose.Types.ObjectId(), name: 'Ananya Verma', email: 'ananya@bvm.edu.in', role: 'club_admin', organizationId: 'org1', clubIds: [], rollNumber: '20BECE072', year: 3, phone: '+91 98765 22222', interests: ['Design', 'UX'], createdAt: '2024-03-01T00:00:00Z' },
        { _id: new mongoose.Types.ObjectId(), name: 'Arjun Nair', email: 'arjun@bvm.edu.in', role: 'club_admin', organizationId: 'org1', clubIds: [], rollNumber: '20BECE089', year: 3, phone: '+91 98765 33333', interests: ['Robotics'], createdAt: '2024-04-01T00:00:00Z' },
        { _id: new mongoose.Types.ObjectId(), name: 'Raj Organizer', email: 'rajorg@bvm.edu.in', role: 'organizer', organizationId: 'org1', clubIds: [], rollNumber: '21BECE100', year: 2, phone: '+91 98765 44444', interests: ['Events', 'Management'], createdAt: '2024-04-01T00:00:00Z' },
        { _id: new mongoose.Types.ObjectId(), name: 'Raj Patel', email: 'raj@bvm.edu.in', role: 'student', organizationId: 'org1', clubIds: [], rollNumber: '21BECE056', year: 2, phone: '+91 98765 55555', interests: ['Robotics', 'IoT'], createdAt: '2024-03-01T00:00:00Z' },
        { _id: new mongoose.Types.ObjectId(), name: 'Priya Shah', email: 'priya@bvm.edu.in', role: 'student', organizationId: 'org1', clubIds: [], rollNumber: '22BECE011', year: 1, phone: '+91 98765 66666', interests: ['Web Dev'], createdAt: '2024-04-01T00:00:00Z' },
        { _id: new mongoose.Types.ObjectId(), name: 'Neha Gupta', email: 'neha@bvm.edu.in', role: 'student', organizationId: 'org1', clubIds: [], rollNumber: '22BECE045', year: 1, phone: '+91 98765 77777', interests: ['AI/ML', 'Data Science'], createdAt: '2024-05-01T00:00:00Z' },
    ]);
    console.log(`Seeded ${users.length} users.`);

    // Build lookup by email for easy reference
    const u = {};
    users.forEach(user => u[user.email.split('@')[0]] = user._id.toString());

    // ── Credentials ──
    const creds = [
        { email: 'admin@mitra.dev', password: 'Admin@123', userId: u.admin },
        { email: 'mehta@bvm.edu.in', password: 'OrgAdmin@123', userId: u.mehta },
        { email: 'hardik@bvm.edu.in', password: 'Club@123', userId: u.hardik },
        { email: 'dhaval@bvm.edu.in', password: 'Club@123', userId: u.dhaval },
        { email: 'ananya@bvm.edu.in', password: 'Club@123', userId: u.ananya },
        { email: 'arjun@bvm.edu.in', password: 'Club@123', userId: u.arjun },
        { email: 'rajorg@bvm.edu.in', password: 'Organizer@123', userId: u.rajorg },
        { email: 'raj@bvm.edu.in', password: 'Student@123', userId: u.raj },
        { email: 'priya@bvm.edu.in', password: 'Student@123', userId: u.priya },
        { email: 'neha@bvm.edu.in', password: 'Student@123', userId: u.neha },
    ];
    await Credential.insertMany(creds);
    console.log(`Seeded ${creds.length} credentials.`);

    // ── Organization ──
    const org = await new Organization({
        name: 'BVM Engineering College',
        domain: 'bvm.edu.in',
        website: 'https://bvmengineering.ac.in',
        description: 'Birla Vishwakarma Mahavidhyalay — A premier engineering institution in Gujarat fostering innovation and technical excellence since 1948.',
        admins: [u.mehta],
        isVerified: true,
        dataHosting: 'self_hosted',
        customAnnouncement: '🎉 TechFest 2026 registrations are now open! Register before April 8th.',
        createdAt: '2024-01-01T00:00:00Z'
    }).save();
    const orgId = org._id.toString();
    console.log(`Seeded organization: ${org.name}`);

    // Update users' organizationId to real org _id
    await User.updateMany({ organizationId: 'org1' }, { organizationId: orgId });

    // ── Clubs ──
    const clubs = await Club.insertMany([
        { name: 'AWS Cloud Club', description: 'Exploring cloud computing, AWS services, and building scalable solutions. Weekly workshops, hackathons, and guest sessions from industry experts.', organizationId: orgId, admins: [u.hardik], members: [u.hardik, u.dhaval, u.raj, u.ananya, u.priya, u.rajorg], createdAt: '2024-02-01T00:00:00Z' },
        { name: 'Coding Club', description: 'Competitive programming, DSA practice, and coding contests. From beginners to ICPC aspirants — everyone is welcome.', organizationId: orgId, admins: [u.dhaval], members: [u.hardik, u.dhaval, u.raj, u.arjun, u.neha], createdAt: '2024-02-15T00:00:00Z' },
        { name: 'Design & UX Society', description: 'UI/UX design, Figma workshops, design thinking sessions, and portfolio reviews. Making tech beautiful.', organizationId: orgId, admins: [u.ananya], members: [u.hardik, u.ananya, u.priya, u.neha], createdAt: '2024-03-01T00:00:00Z' },
        { name: 'Robotics Club', description: 'Building autonomous robots, drones, and IoT projects. From line followers to humanoids.', organizationId: orgId, admins: [u.arjun], members: [u.raj, u.arjun], createdAt: '2024-03-15T00:00:00Z' },
    ]);
    console.log(`Seeded ${clubs.length} clubs.`);

    // Update users' clubIds
    for (const club of clubs) {
        await User.updateMany(
            { _id: { $in: club.admins.map(id => new mongoose.Types.ObjectId(id)) } },
            { $addToSet: { clubIds: club._id.toString() } }
        );
    }

    const cl = {};
    clubs.forEach(c => cl[c.name] = c._id.toString());

    // ── Events ──
    const events = await Event.insertMany([
        {
            title: 'Cloud Native Hackathon 2026',
            description: 'A 36-hour hackathon focused on building cloud-native applications using AWS, Docker, and Kubernetes. Teams of 2-4 members. Prizes worth ₹50,000.',
            clubId: cl['AWS Cloud Club'], organizationId: orgId, organizerId: u.hardik,
            eventType: 'main_event', startTime: '2026-03-20T09:00:00Z', endTime: '2026-03-21T21:00:00Z',
            location: 'Seminar Hall 1, BVM Campus', category: 'hackathon', capacity: 120,
            registrationDeadline: '2026-03-18T23:59:00Z', status: 'published',
            gallery: [], resources: [], coOrganizers: [cl['Coding Club']],
            registeredCount: 87, attendedCount: 0, teamSize: 4, allowExternalParticipants: true,
            createdAt: '2026-02-15T00:00:00Z'
        },
        {
            title: 'Intro to Figma — Design Workshop',
            description: 'Learn the fundamentals of UI design using Figma. From components to prototyping.',
            clubId: cl['Design & UX Society'], organizationId: orgId, organizerId: u.ananya,
            eventType: 'main_event', startTime: '2026-03-20T14:00:00Z', endTime: '2026-03-20T17:00:00Z',
            location: 'Computer Lab 3, BVM Campus', category: 'workshop', capacity: 50,
            registrationDeadline: '2026-03-19T23:59:00Z', status: 'published',
            gallery: [], resources: [], coOrganizers: [],
            registeredCount: 48, attendedCount: 0, createdAt: '2026-02-20T00:00:00Z'
        },
        {
            title: 'TechFest 2026',
            description: 'The biggest annual tech festival of BVM Engineering College! Three days of hackathons, workshops, tech talks, robotics competitions, and cultural events.',
            clubId: cl['AWS Cloud Club'], organizationId: orgId, organizerId: u.hardik,
            eventType: 'main_event', startTime: '2026-04-10T09:00:00Z', endTime: '2026-04-12T21:00:00Z',
            location: 'BVM Campus — Multiple Venues', category: 'fest', capacity: 500,
            registrationDeadline: '2026-04-08T23:59:00Z', status: 'published',
            gallery: [], resources: [], coOrganizers: [cl['Coding Club'], cl['Design & UX Society'], cl['Robotics Club']],
            registeredCount: 234, attendedCount: 0, allowExternalParticipants: true,
            createdAt: '2026-01-10T00:00:00Z'
        },
        {
            title: 'DSA Bootcamp — Week 1',
            description: 'Intensive Data Structures and Algorithms bootcamp. Week 1 covers Arrays, Strings, and Two Pointers.',
            clubId: cl['Coding Club'], organizationId: orgId, organizerId: u.dhaval,
            eventType: 'main_event', startTime: '2026-03-12T10:00:00Z', endTime: '2026-03-12T13:00:00Z',
            location: 'Room 204, Academic Block', category: 'workshop', capacity: 80,
            registrationDeadline: '2026-03-11T23:59:00Z', status: 'published',
            gallery: [], resources: [], coOrganizers: [],
            registeredCount: 80, attendedCount: 72, createdAt: '2026-02-25T00:00:00Z'
        },
        {
            title: 'AI in Healthcare — Guest Lecture',
            description: 'Dr. Priya Sharma from IIT Bombay shares her research on applying machine learning to medical imaging.',
            clubId: cl['AWS Cloud Club'], organizationId: orgId, organizerId: u.hardik,
            eventType: 'main_event', startTime: '2026-03-25T15:00:00Z', endTime: '2026-03-25T17:00:00Z',
            location: 'Auditorium, BVM Campus', category: 'tech_talk', capacity: 200,
            registrationDeadline: '2026-03-24T23:59:00Z', status: 'published',
            gallery: [], resources: [], coOrganizers: [],
            registeredCount: 145, attendedCount: 0, createdAt: '2026-03-01T00:00:00Z'
        },
        {
            title: 'Robo Wars Championship',
            description: 'Build your battle robot and compete in the arena! Weight classes: Mini (1kg) and Standard (5kg).',
            clubId: cl['Robotics Club'], organizationId: orgId, organizerId: u.arjun,
            eventType: 'main_event', startTime: '2026-04-05T10:00:00Z', endTime: '2026-04-05T18:00:00Z',
            location: 'Ground Floor Hall, BVM Campus', category: 'competition', capacity: 30,
            registrationDeadline: '2026-04-03T23:59:00Z', status: 'published',
            gallery: [], resources: [], coOrganizers: [],
            registeredCount: 22, attendedCount: 0, teamSize: 3, createdAt: '2026-03-01T00:00:00Z'
        },
        {
            title: 'Annual Cultural Night',
            description: 'Music, dance, drama, and stand-up comedy. The biggest cultural event of the year!',
            clubId: cl['Design & UX Society'], organizationId: orgId, organizerId: u.ananya,
            eventType: 'main_event', startTime: '2026-04-15T18:00:00Z', endTime: '2026-04-15T23:00:00Z',
            location: 'Open Air Theatre, BVM Campus', category: 'cultural', capacity: 400,
            registrationDeadline: '2026-04-14T23:59:00Z', status: 'pending_approval',
            gallery: [], resources: [], coOrganizers: [],
            registeredCount: 0, attendedCount: 0, createdAt: '2026-03-05T00:00:00Z'
        },
        {
            title: 'Web Dev with React — Completed',
            description: 'A comprehensive workshop on building modern web apps with React, TypeScript, and Tailwind CSS.',
            clubId: cl['Coding Club'], organizationId: orgId, organizerId: u.dhaval,
            eventType: 'main_event', startTime: '2026-02-10T10:00:00Z', endTime: '2026-02-10T16:00:00Z',
            location: 'Computer Lab 2, BVM Campus', category: 'workshop', capacity: 60,
            registrationDeadline: '2026-02-09T23:59:00Z', status: 'completed',
            gallery: [], resources: [
                { type: 'slides', title: 'Workshop Slides', link: 'https://slides.example.com', uploadedBy: u.dhaval },
                { type: 'recording', title: 'Session Recording', link: 'https://youtube.com/example', uploadedBy: u.dhaval },
                { type: 'github', title: 'Workshop Code', link: 'https://github.com/example/react-workshop', uploadedBy: u.dhaval },
            ],
            coOrganizers: [],
            registeredCount: 58, attendedCount: 52, createdAt: '2026-01-20T00:00:00Z'
        },
    ]);
    console.log(`Seeded ${events.length} events.`);

    const ev = {};
    events.forEach(e => ev[e.title] = e._id.toString());

    // ── Sub-Events for TechFest ──
    const techFestId = ev['TechFest 2026'];
    const subEvents = await Event.insertMany([
        {
            title: 'TechFest: Code Wars (Competitive Programming)',
            description: 'Multi-round competitive programming contest.',
            clubId: cl['Coding Club'], organizationId: orgId, organizerId: u.dhaval,
            eventType: 'sub_event', parentEventId: techFestId,
            startTime: '2026-04-10T10:00:00Z', endTime: '2026-04-10T14:00:00Z',
            location: 'Computer Lab A, BVM Campus', category: 'competition', capacity: 80,
            registrationDeadline: '2026-04-08T23:59:00Z', status: 'published',
            gallery: [], resources: [], coOrganizers: [],
            registeredCount: 42, attendedCount: 0, createdAt: '2026-02-01T00:00:00Z'
        },
        {
            title: 'TechFest: UI/UX Design Hackathon',
            description: '8-hour design sprint. Teams of 2.',
            clubId: cl['Design & UX Society'], organizationId: orgId, organizerId: u.ananya,
            eventType: 'sub_event', parentEventId: techFestId,
            startTime: '2026-04-11T09:00:00Z', endTime: '2026-04-11T17:00:00Z',
            location: 'Design Studio, BVM Campus', category: 'hackathon', capacity: 40,
            registrationDeadline: '2026-04-08T23:59:00Z', status: 'published',
            gallery: [], resources: [], coOrganizers: [],
            registeredCount: 28, attendedCount: 0, teamSize: 2, createdAt: '2026-02-01T00:00:00Z'
        },
        {
            title: 'TechFest: Robo Soccer Championship',
            description: 'Build an autonomous robot that can play soccer!',
            clubId: cl['Robotics Club'], organizationId: orgId, organizerId: u.arjun,
            eventType: 'sub_event', parentEventId: techFestId,
            startTime: '2026-04-12T10:00:00Z', endTime: '2026-04-12T17:00:00Z',
            location: 'Ground Floor Hall, BVM Campus', category: 'competition', capacity: 24,
            registrationDeadline: '2026-04-08T23:59:00Z', status: 'published',
            gallery: [], resources: [], coOrganizers: [],
            registeredCount: 18, attendedCount: 0, teamSize: 3, createdAt: '2026-02-01T00:00:00Z'
        },
    ]);
    console.log(`Seeded ${subEvents.length} sub-events.`);

    // ── Registrations ──
    const figmaEventId = ev['Intro to Figma — Design Workshop'];
    const regs = await Registration.insertMany([
        { userId: u.raj, eventId: figmaEventId, status: 'registered', ticketQR: 'QR-RAJ-FIGMA-2026', participantName: 'Raj Patel', rollNumber: '21BECE056', year: 2, phone: '+91 98765 55555' },
        { userId: u.neha, eventId: techFestId, status: 'registered', ticketQR: 'QR-NEHA-TECHFEST-2026', participantName: 'Neha Gupta', rollNumber: '22BECE045', year: 1, phone: '+91 98765 77777' },
    ]);
    console.log(`Seeded ${regs.length} registrations.`);

    // ── Comments ──
    const hackathonId = ev['Cloud Native Hackathon 2026'];
    const comments = await Comment.insertMany([
        { eventId: hackathonId, userId: u.dhaval, userName: 'Dhavalkumar Prajapati', message: 'Can we use any cloud provider or only AWS?', createdAt: '2026-03-01T10:00:00Z' },
        { eventId: hackathonId, userId: u.hardik, userName: 'Hardik Bandhiya', message: 'Any cloud provider is allowed! AWS, GCP, Azure — your choice.', createdAt: '2026-03-01T11:00:00Z' },
        { eventId: hackathonId, userId: u.ananya, userName: 'Ananya Verma', message: 'Are solo participants allowed or teams only?', createdAt: '2026-03-02T09:00:00Z' },
        { eventId: figmaEventId, userId: u.raj, userName: 'Raj Patel', message: 'Do we need any prior design experience?', createdAt: '2026-03-05T14:00:00Z' },
        { eventId: figmaEventId, userId: u.ananya, userName: 'Ananya Verma', message: 'No prior experience needed! This is a beginner-friendly workshop.', createdAt: '2026-03-05T15:00:00Z' },
    ]);
    console.log(`Seeded ${comments.length} comments.`);

    // ── Announcements ──
    const announcements = await Announcement.insertMany([
        { eventId: hackathonId, message: 'Mentors from AWS confirmed! We have 3 AWS Solution Architects joining.', postedBy: u.hardik, postedByName: 'Hardik Bandhiya', createdAt: '2026-03-05T10:00:00Z' },
        { eventId: hackathonId, message: 'Prize pool increased to ₹75,000! Thanks to our sponsors.', postedBy: u.hardik, postedByName: 'Hardik Bandhiya', createdAt: '2026-03-08T10:00:00Z' },
        { eventId: techFestId, message: 'TechFest schedule is now live! Check the sub-events for detailed timings.', postedBy: u.hardik, postedByName: 'Hardik Bandhiya', createdAt: '2026-03-10T10:00:00Z' },
    ]);
    console.log(`Seeded ${announcements.length} announcements.`);

    // ── Club Requests ──
    const clubRequests = await ClubRequest.insertMany([
        { clubName: 'AI & Machine Learning Club', description: 'A club focused on exploring AI, ML, and deep learning.', organizationId: orgId, requestedBy: u.raj, requestedByName: 'Raj Patel', requestedByEmail: 'raj@bvm.edu.in', status: 'pending', createdAt: '2026-03-05T10:00:00Z' },
        { clubName: 'Cybersecurity Club', description: 'Ethical hacking, CTF competitions, and cyber awareness workshops.', organizationId: orgId, requestedBy: u.priya, requestedByName: 'Priya Shah', requestedByEmail: 'priya@bvm.edu.in', status: 'pending', createdAt: '2026-03-06T14:00:00Z' },
    ]);
    console.log(`Seeded ${clubRequests.length} club requests.`);

    console.log('\n✅ Database seeded successfully!');
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
