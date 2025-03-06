const User = require('../models/User');

const createUser = async (req, res) => {
    console.log(req.body);
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    console.log(req.body);
    try {
        const user = await User.findOne({adminId: req.body.adminId, password: req.body.password});
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return the user with a token property that the client expects
        // Or you can implement proper token-based authentication here
        res.status(200).json({
            user,
            token: user._id // Using user ID as a simple token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createUser,
    loginUser
};
