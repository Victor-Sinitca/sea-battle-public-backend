const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const Profile = mongoose.model('UsersProfile');


//POST new user route (optional, everyone has access)
router.post('/', auth.optional, async (req, res, next) => {
    const {body: {user}} = req;
    let userName = "лошара"
    if (!user.email) {
        return res.status(422).json({
            errors: {
                email: 'is required',
            },
        });
    }
    if (!user.password) {
        return res.status(422).json({
            errors: {
                password: 'is required',
            },
        });
    }
    if (user.name) {
        userName = user.name
    }
    const finalUser = new Users(user);
    const profileFinalUser = new Profile({
            _id: finalUser._id,
            name: userName,
            photo: "",
            status: "I new user",
            seaBattleSate: {
                numberOfGames:"0",
                numberOfWins:"0",
                numberOfLosses:"0"
            }
        }
    )
    await finalUser.setPassword(user.password);
    await finalUser.save()
    await profileFinalUser.save()
    return res.json({
        user: {
            ...finalUser.toAuthJSON(), ...{name: profileFinalUser.name}
        }
    })
});


//POST login route (optional, everyone has access)
router.post('/login', auth.optional, (req, res, next) => {
    const {body: {user}} = req;

    if (!user.email) {
        return res.status(422).json({
            errors: {
                email: 'is required',
            },
        });
    }
    if (!user.password) {
        return res.status(422).json({
            errors: {
                password: 'is required',
            },
        });
    }

    return passport.authenticate('local', {session: false}, (err, passportUser, info) => {
        if (err) {
            return next(err);
        }

        if (passportUser) {
            const user = passportUser;
            user.token = passportUser.generateJWT();

            return res.json({user: user.toAuthJSON()});
        }

        return status(400).info;
    })(req, res, next);
});

//GET current route (required, only authenticated users have access)
router.get('/current', auth.required, (req, res, next) => {
    const {payload: {id}} = req;

    return Users.findById(id)
        .then((user) => {
            if (!user) {
                return res.sendStatus(400);
            }
            return res.json({user: user.toAuthJSON()});
        });
});

router.get('/profile/:userId',auth.required,  (req, res, next) => {
    const userId = req.params.userId;



    console.log("запрос профиля")
    /*console.log(req)*/




    return Profile.findById(userId)
        .then((profile) => {
            if (!profile) {
                return res.sendStatus(400);
            }
            return res.json({...profile.getProfile()});
        });
});

module.exports = router;
