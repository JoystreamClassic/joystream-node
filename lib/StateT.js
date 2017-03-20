var StateT = {
  UNUSED_ENUM_FOR_BACKWARDS_COMPATIBILITY: 0,
  CHECKING_FILES: 1,
  DOWNLOADING_METADATA: 2,
  DOWNLOADING: 3,
  FINISHED: 4,
  SEEDING: 5,
  ALLOCATING: 6,
  CHECKING_RESUME_DATA: 7,
  properties: {
    0: {name: 'not suppose to see that', value: 0},
    1: {name: 'Checking files', value: 1},
    2: {name: 'Downloading metadata', value: 2},
    3: {name: 'Downloading', value: 3},
    4: {name: 'Finished', value: 4},
    5: {name: 'Seeding', value: 5},
    6: {name: 'Allocating', value: 6},
    7: {name: 'Checking resume data', value: 7}
  }
}

module.exports = StateT
