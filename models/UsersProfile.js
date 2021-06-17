const mongoose = require('mongoose');

const { Schema } = mongoose;

const UsersProfileSchema = new Schema({
    _id:String,
    name: String,
    photo: String,
    status: String,
});

UsersProfileSchema.methods.setProfile = function(profile) {
    this.name = profile.name
    this.photo = profile.photo
    this.status = profile.status
};
UsersProfileSchema.methods.getProfile = function() {
    return{
        name:this.name ,
        photo:this.photo ,
        status:this.status ,
    }
};

mongoose.model('UsersProfile', UsersProfileSchema);
