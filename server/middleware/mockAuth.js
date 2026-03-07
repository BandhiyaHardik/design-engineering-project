const mockAuth = (req, res, next) => {
    req.user = {
        id: "mock_student_123",
        name: "Test Student",
        email: "student@navaracoders.edu",
        role: "student"
    };
    next();
};

module.exports = mockAuth;
