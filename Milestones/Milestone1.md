## Milestone 1 (7th April, 5pm)

### Dataset

For this project, we will use WhatsApp chats, including messages and metadata, as well as the contacts and the architecture of groups, as our dataset. Using WhatsApp data as a resource puts us in a unique position: we can customise the dataset and visualisation for each user on our website. Indeed, with two billion monthly active users, WhatsApp is one of the leading social networks for messaging.

To this end, we have built a web system that acts as a client (like What's app web) for the WhatsApp API. The user simply scans the QR code displayed. As soon as the user is logged in, our web application retrieves locally (in the user's browser) the user's WhatsApp data for the last three years. As long as the user is logged in, new messages flow in and are integrated into our dynamic visualisations.

Several layers in several languages are needed to achieve such results. We will focus on the format of the data received by the javascript layer, after pre-processing and formatting in the lower layers, as this is the format that will be used as a basis for the visualisations.

We have three types of application messages that transmit new data. The first is the message, here is its architecture:
```
<message_id> : 
{
  chat: <chat_id>,
  id: <message_id>
  message: <message_text>
  sent-by: <user_id>
  timestamp: <date_time>
}
```
The second one is a contact message:
```
<contact_id> : 
{
  id: <contact_id>
  status: <conatct_status>
  name: <contact_name>
  avatar: <link_to_contact_profile_picture>
}
```
The third and final type of application message received by javascript layer is describing a chat:
```
<chat_id> : 
{
  avatar: <link_to_the_chat_picture>
  name: <chat_name>
  owner_id: <chat_owner_id>
  participants: [<particpant_id>, ..]
  topic: <chat_topic>
}
```
Our dataset is therefore a collection of thousands (depending on the user's network/activity) of such messages.

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


