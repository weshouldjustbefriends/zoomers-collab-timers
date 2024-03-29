const l = require( './../config/winston' );

const RepeatingTimers = function ( 
  // sockId, 
  v, 
  // simpMe, 
  
  sassy, 
  emitRoom, 
  logItWrapper, 

  startTimer, 
  stopTimer 
) {
  const module = {};

  // @param inRoom: String
  // @param work: Number?
  // @param brake: Number?
  // @param length: Number
  // @globals sassy
  // @anotherFile emitRoom()
  // @anotherFile async logItWrapper()
  // @anotherFile startTimer()
  module.repeatingStart = async ( inRoom, aUser, work, brake, length ) => {
    const curr = sassy[ inRoom ];    
    const { repeat } = curr;
    if ( repeat.on == true ) {
      emitRoom( 'repeat timers already begun', { room: inRoom } );
      return false;
    };

    curr.manager = { 
      username: aUser.nickname, 
      email: aUser.mail 
    };

    const theTime = new Date().getTime();
    v.HR_REPEAT ??= 1;
    curr.repeat = { 
      on: true, 
      length, 
      // allow debugging w/ quicker times
      // For HR_REPEAT 5, 8, 10, 15. Value of 1H translates to: 2.4min, 50s, 36s, 16s
      startTime: theTime, 
      endTime: theTime + ( length * ( 60 / v.HR_REPEAT ) * ( 60 / v.HR_REPEAT ) * 1000 ), 
      work, 
      brake 
    };
    const event = 'repeating timers on';
    emitRoom( event, { room: inRoom, ...curr.repeat } );
    await logItWrapper( inRoom, aUser, event, 'repeating timers on & started' );

    const { session } = curr;
    if ( session === 'brake' ) {
      emitRoom( 'session skipped', { room: inRoom, session: session } );
    };
    startTimer( inRoom, aUser, work, 'repeating started' );
  };

  // @param inRoom: String
  // @globals sassy
  resetRepeating = ( inRoom ) => {
    const curr = sassy[ inRoom ];
    curr.repeat = { 
      on: false, 
      length: 0,  
      endTime: 0, 
      work: 0, 
      brake: 0 
    };

    curr.manager = { 
      username: null, 
      email: null 
    };
  };

  // @param inRoom: String
  // @globals sassy
  // @anotherFile emitRoom()
  // @anotherFile async logItWrapper()
  // @internal resetRepeating()
  module.repeatingDone = async ( inRoom, aUser ) => {
    const { repeat } = sassy[ inRoom ];
    if ( repeat.on == false ) {
      emitRoom( 'repeating timers already off', { room: inRoom } );
      return false;
    };

    resetRepeating( inRoom );
    const event = 'repeating timers done';
    emitRoom( event, { room: inRoom } );
    await logItWrapper( inRoom, aUser, event, `repeating timers done after ${ repeat.length } hours` );
  };

  // @param inRoom: String
  // @anotherFile emitRoom()
  // @anotherFile async logItWrapper()
  // @internal resetRepeating()
  // @anotherFile stopTimer()
  module.repeatingStop = async ( inRoom, aUser ) => {
    const { repeat } = sassy[ inRoom ];
    if ( repeat.on == false ) {
      emitRoom( 'repeating already off', { room: inRoom } );
      return false;
    };

    resetRepeating( inRoom );
    stopTimer( inRoom, aUser );

    const event = 'repeating timers stopped';
    emitRoom( event, { room: inRoom } );
    await logItWrapper( inRoom, aUser, event, `repeating timers force stopped` );
  };

  function delay( milliseconds = 1000 ) { 
    return new Promise( resolve => {
      setTimeout( resolve, milliseconds );
    } );
  };
  // @param inRoom: String
  // @param repeat: Object
  // @param session: String ('work' or 'brake')
  // @param skipSession: func()
  // @param startTimer: func()
  // @internal module.repeatingDone()
  module.wrappingUpRepeating = async ( inRoom, aUser, repeat, session, skipSession, startTimer ) => {
    if ( repeat.on != true ) {
      return;
    };

    if ( repeat.endTime < new Date().getTime() ) {
      l.parm.debug( 'if === aka done', 'repeat.endTime < new Date().getTime()' );
      await module.repeatingDone( inRoom, aUser );
    } else {
      // what's the point of this again?
      await delay( 1000 );
      l.parm.debug( 'if else aka continuing', 'repeat.endTime >= new Date().getTime()' );

      const newSesh = session === 'work' ? 'brake' : 'work';
      skipSession( inRoom, aUser, repeat.on );      
      const newSeshInMin = repeat[ newSesh ];
      startTimer( inRoom, aUser, newSeshInMin, 'repeating continued' );
      // emitRoom('unpause button');
    };
  };

  return module;
};

module.exports = RepeatingTimers;
