## Milestone 1 (7th April, 5pm)

**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

*(max. 2000 characters per section)*

### Dataset

> Find a dataset (or multiple) that you will explore. Assess the quality of the data it contains and how much preprocessing / data-cleaning it will require before tackling visualization. We recommend using a standard dataset as this course is not about scraping nor data processing.
>
> Hint: some good pointers for finding quality publicly available datasets ([Google dataset search](https://datasetsearch.research.google.com/), [Kaggle](https://www.kaggle.com/datasets), [OpenSwissData](https://opendata.swiss/en/), [SNAP](https://snap.stanford.edu/data/) and [FiveThirtyEight](https://data.fivethirtyeight.com/)), you could use also the DataSets proposed by the ENAC (see the Announcements section on Zulip).

For this class, we decided to use the whatsapp messages as a the dataset for our project. To have the best experience for each user of our project, we built a web system that would parse the web whatsapp application into a dataset containing all the messages the user sent. We sucessfully managed to get the text of the messages, the correspondant and the associated image, if a message was sent to a group (and the group image) and the moment of sending.  

### Problematic

The main axis we want to develop is the social graph of the user. By visualizing the graph, the user will be able to see who are the people he talks the most to, what groups is he in and with whom.

This visualization will enable the user to become aware of his usage of whatsapp. Indeed, he will be able to analyze who he is talking to the most, at what frequency and time of the day. For instance, if he talks to someone with a frequency of one message every five minutes, the user might want to write longer messages, or if he sees that he often talks late a night, he can try to finish his conversations earlier so his sleep schedule isn't messed up.

The motivation of the project falls within the scope of social media usage, and how can we try to make a better use of them. By providing such vizualisations to the users he might become aware on how much time he spends on whatsapp and would want to improve that. Thefore, here the main audience would be people that use a lot whatsapp as a mean of communication to have a realistic overview of their behavior.



### Exploratory Data Analysis

> Pre-processing of the data set you chose
> - Show some basic statistics and get insights about the data

### Related work


> - What others have already done with the data?
> - Why is your approach original?
> - What source of inspiration do you take? Visualizations that you found on other websites or magazines (might be unrelated to your data).
> - In case you are using a dataset that you have already explored in another context (ML or ADA course, semester project...), you are required to share the report of that work to outline the differences with the submission for this class.

As for each user the data will be new, we can't compare our direct dataset to already existing ones.

In our approach, we process the messages on the fly, building the vizualization progressively as we parse the message, enabling the user to see in real time the statistics change.

We took inspiration in graphs that would simulate the dynamics in populations and how would information spread out in these.


