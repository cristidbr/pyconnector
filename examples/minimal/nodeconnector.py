import time
import sys
import json
import zmq
import platform

from threading import Thread

"""
Python API endpoint interface

Provides an interface to APIs implemented using Python  
"""
class Interface:
    # create
    def __init__( self ):
        self.port = 24001
        # publisher socket
        self.context = zmq.Context( )
        self.socket = self.context.socket( zmq.REP )
        
        # routes
        self.router = {}

        # thread processing
        self.thread = None

    # task processing
    def _tasking( self ):
        # infinite loop
        while( True ):
            # query processing
            if( self.socket.poll( 0 ) ):
                query = json.loads( self.socket.recv() )

                # return registered handlers
                if( query[ '_p' ] == '__pyroutes' ):
                    reply = [ k for k in self.router ]
                    self.socket.send_json( dict( _p = query[ '_p' ], _id = query[ '_id' ], data = reply ) )

                # check query path
                elif( query[ '_p' ] in self.router ):
                    fn, ctx = self.router[ query[ '_p' ] ] 
                    args = {}
                    if( 'args' in query ):
                        args = query[ 'args' ]

                    # execute handler
                    reply = fn( args, ctx )
                          
                    self.socket.send_json( dict( _p = query[ '_p' ], _id = query[ '_id' ], data = reply ) )

            time.sleep( 0.001 )
    
    # reply method
    def reply( self, path ):
        # wrap function
        def replyProxy( data ):
            self.socket.send_json( dict( path = path, data = data ) )

        return replyProxy

    # routing queries
    def handle( self, path, handle, context = {} ):
        self.router[ path ] = ( handle, context )
 
    # launch interface
    def listen( self, port = 24001 ):
        
        # start thread to listen
        if( self.thread is None ):
            self.thread = Thread( target = self._tasking, args = ( ), daemon = True )
            self.thread.start()

        self.port = int( port )
        self.socket.bind( 'tcp://127.0.0.1:%d' % self.port )

