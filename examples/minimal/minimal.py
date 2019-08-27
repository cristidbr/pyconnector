import sys
import time
import argparse
import nodeconnector

# argument parsing, PyConnector automatically sends this
parser = argparse.ArgumentParser( description = 'Python Exposed API' )
parser.add_argument( '--pynodeport', help = 'PyConnector Node.JS query port', default = 24001 )
args = parser.parse_args()

# create interface
nodeq = nodeconnector.Interface( )

# python version query
def nodeq_version( args, ctx = {} ):
    return ( '%d.%d.%d' % ( sys.version_info[ 0 ], sys.version_info[ 1 ], sys.version_info[ 2 ] ) )

# increment value query
def nodeq_increment( args, ctx = {} ):
    # return value
    ctx[ 'inc' ] += 1
    args[ 'value' ] = ctx[ 'inc' ]

    return args

# queries are executed on a separate thread, a context dict can be used to pass data
nodeq.handle( 'pyversion', nodeq_version )
nodeq.handle( 'increment', nodeq_increment, dict( inc = 0 ) ) 

# launch API
nodeq.listen( port = args.pynodeport ) 

# wait
while( True ):
    time.sleep( 0.001 )


