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

We deeply believe that WhatsApp data is a goldmine (no wonder Meta is funding it even though WhatsApp doesn't benefit directly). Equipped with our data science and data visualization tools, we aim to extract and present the valuable knowledge hidden in this massive amount of data. Our website will present actionable insights like a jeweller would present gold rings, without the customer having to get their hands dirty. 

WhatsApp is used to communicate with family, friends, but also with the professional network. Indeed, communication on WhatsApp is so easy that many people are abandoning email. Today, many organisations and freelancers (including, unofficially, the Swiss army) rely on WhatsApp to carry out their daily activities.

The main goal of our visualisations is to give the user an overview of his (contact) network. A good understanding of the landscape of your connections allows you to maintain and exploit them. We plan to build a visualisation that answers the following questions. Who is in your network and how close are you to them? Who is connected to whom? In what context do you know someone? 

Once the user has a good level of understanding of their network, we want to allow them to dig deeper into a specific contact/group. What are the main topics discussed? What time of day (or night) is the person most responsive? What is the typical language used to communicate with this person? 

Easy access to these answers will undoubtedly facilitate the management of a professional (or even friendly) network.

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


