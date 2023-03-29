## Milestone 1 (7th April, 5pm)

### Dataset

For this class, we decided to use the WhatsApp messages as a the dataset for our project. To have the best experience for each user of our project, we built a web system that would parse the web WhatsApp application into a dataset containing all the messages the user has. We sucessfully managed to get the text of the messages, the correspondant and the associated image, if a message was sent to a group (and the group image) and the moment of sending.  

The data is of great quality as it comes directly from the Whatsapp logs. 

### Problematic

The main axis we want to develop is the social graph of the user. By visualizing the graph, the user will be able to see who are the people he talks the most to, what groups is he in and with whom.

This visualization will enable the user to become aware of his usage of WhatsApp. Indeed, he will be able to analyze who he is talking to the most, at what frequency and time of the day. For instance, if he talks to someone with a frequency of one message every five minutes, the user might want to write longer messages, or if he sees that he often talks late a night, he can try to finish his conversations earlier so his sleep schedule is not messed up.

The motivation of the project falls within the scope of social media usage, and how can we try to make a better usage of them. By providing such vizualisations to the users he might become aware on how much time he spends on whatsapp and would want to improve that. Thefore, here the main audience would be people that use a lot whatsapp as a mean of communication to have a realistic overview of their behavior.



### Exploratory Data Analysis

Some pre-processing we have to do before being able to compute statistics about the messages, is to transform the messages for each discussion the user has, we have to parse the message to a common message structure that would consist of the message content, the name of the contact, the avatar, the status, the message id, and group information.

Some statistics (which are user dependent) we have are:
  - The number of message
  - The number of contacts
  - The number of groups
  - The number of words
  - The average number of messages per contact
  - The aberage length of messages per contact 
  - The average time the messages were sent
  - Top 3 most talked people 


### Related work

As for each user the data will be new, we can not compare our direct dataset to already existing ones. Nevertheless, Whatsapp chat analyzers already exist. Our approach is different as we process the messages on the fly, building the vizualization progressively as we parse the messages, enabling the user to see in real time the statistics change. This is due to the fact that existing WhatsApp chat analyzers need an uploaded folder with all the messages in it, whereas in our approach you just need to scan the QR code.

We took inspiration in graphs that would simulate the dynamics in populations and how would information spread out in these. As it is the conventional manner to visualize communications between human beings, we wanted to develop that idea to observe what we do with todays means of communications.  


