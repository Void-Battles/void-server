const router = require('express').Router()
const VB_USERS = require('../schemas/VB_USERS')
const VB_TEAMS = require('../schemas/VB_TEAMS')

// This endpoint will get data on a particular vb_username
router.get('/:vb_username', (req, res) => {
    const { vb_username } = req.params
    VB_USERS.findOne({ vb_username }, { _id: false, password: false, __v: false }).lean().exec((err, data) => {
      if (err || !data) return res.status(400).send('User Not Found...')
      else {
        if(data.team_id) {
            VB_TEAMS.findById(data.team_id).lean().exec((error, response) => {
            data.team_id = response
            return res.status(200).send(data)
          })
        } else return res.status(200).send(data)
      }
    })
  })

  module.exports = router