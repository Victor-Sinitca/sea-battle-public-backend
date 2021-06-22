const mongoose = require('mongoose');

const {Schema} = mongoose;

const UsersProfileSchema = new Schema({
    _id: String,
    name: String,
    photo: String,
    status: String,
    seaBattleSate: {
        numberOfGames: String,
        numberOfWins: String,
        numberOfLosses: String,
    }
});

UsersProfileSchema.methods.setProfile = function (profile) {
    this.name = profile.name
    this.photo = profile.photo
    this.status = profile.status
    this.seaBattleSate = {
        numberOfGames: profile.seaBattleSate.numberOfGames,
        numberOfWins: profile.seaBattleSate.numberOfWins,
        numberOfLosses: profile.seaBattleSate.numberOfLosses,
    }
};
UsersProfileSchema.methods.getProfile = function () {
    return {
        id: this._id,
        name: this.name,
        photo: this.photo,
        status: this.status,
        seaBattleSate: {
            numberOfGames: this.seaBattleSate.numberOfGames,
            numberOfWins: this.seaBattleSate.numberOfWins,
            numberOfLosses: this.seaBattleSate.numberOfLosses,
        }
    }
};

mongoose.model('UsersProfile', UsersProfileSchema);
