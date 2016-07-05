# Client - Creative Catalyst For Pair Choreography Based On Genetic Algorithm
Creative Catalyst For Pair Choreography Based On Genetic Algorithm. The system uses a kinecct senser to capture initial input, and employs a genetic algorithm to generate novel movement catalysts for the choreographers. This is the client part of the system. 

##Screenshots
###Initialization of Input (Realtime in Kinect Capture)
![Alt text](https://cloud.githubusercontent.com/assets/5469750/16571701/cf5ecacc-4215-11e6-8c03-e9b5fd233d28.png "Initialization of Input (Realtime in Kinect Capture)")
###Generation of Novel Movement Catalyst
![Alt text](https://cloud.githubusercontent.com/assets/5469750/16571707/f25c48c4-4215-11e6-80b4-992559879c0a.png "Generation of Novel Movement Catalyst")
###Parent Pools and Generation Results in Different Settings
(a) Influence = 0, Intensity = 0 (default setting);
(b) Influence = 100, Intensity = 0;
(c) Influence = 0, Intensity = 100;
(d) Influence = 36, Intensity = 36;
![Alt text](https://cloud.githubusercontent.com/assets/5469750/16571711/fe4c5854-4215-11e6-9145-214b9efd3f49.png "Parent Pools and Generation Results in Different Settings")

##System structure 
The whole system includes three layers of structure: Kinect input layer, network connection layer and application layer. The Kinect input layer is the lowest layer. In this layer, we use a Microsoft Kinect 2 motion sensor for the motion capture of the users. This sensor is connected to the socket server in the network connection layer. The socket server runs a C# program which manipulate the Kinect sensor with its SDK. In the network connection layer, there are two different server set up. The web server delivers the necessary files of the website to the client when requested, including a JavaScript file, which sets up WebSocket connection with the socket server. The socket server, which is connected to the Kinect sensor, deals with the connection request, build up the socket con
![Alt text](https://cloud.githubusercontent.com/assets/5469750/16571705/e2b97f54-4215-11e6-832c-2042815970df.png "Optional title")

