const router = require("express").Router();
const bcrypt = require('bcryptjs')
const VB_USERS = require("../schemas/VB_TEAMS.js");

router.post("/register_user", (req, res) => {
  let new_user = new VB_USERS({
    _id: generateUserId(),
    ...req.body,
    password: bcrypt.hashSync(req.body.password, Number(process.env.GENSALT)),
    team_id: null,
    profile_pic: selectProfilePic()
  });

  new_user.save(err => {
    if (err) console.log(err);
    else {
      let user = userAccount(new_user);
      user.pending_invites = [];
      return res.status(200).send(user);
    }
  });
});

function generateUserId() {
  return `vb_${Math.random()
    .toString(36)
    .substr(2, 10)}`;
}

function userAccount(new_user) {
  let user = JSON.parse(JSON.stringify(new_user));
  user.auth_token = new Buffer(user._id).toString("base64");
  delete user.password;
  delete user._id;
  delete user.__v;
  return user;
}

function selectProfilePic() {
  let pictures = ["bill", "feng", "jake", "kate", "laurie", "meg"];
  return pictures[Math.floor(Math.random() * pictures.length)];
}

module.exports = router;
