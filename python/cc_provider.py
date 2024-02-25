import socketio
import time

if __name__=="__main__":
    with socketio.SimpleClient() as sio:
        sio.connect('http://localhost:5000')
        sio.emit('cc_provider_get_socket_ids', {})
        time.sleep(0.1)
        
        caller_id = sio.input_buffer[-1][-1]['callers'][0]
        print(caller_id)
        
        while True:
            
            raw_input = input("write what to display: \n\n")
            for caller_id in sio.input_buffer[-1][-1]['callers']:
                sio.emit('cc_provider', {'id': caller_id, 'message': f'{raw_input}'})
            
            # sio.receive(timeout=2.0)
