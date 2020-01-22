TrelloDash
==========
Show all cards from different boards that match specific filters. 
Application is based on TrelloWall

Filters:
--------
Those filters are set by url-parameters.  
													
* __organization__  
only load cards on boards from a specific organization					

* __members__ 
only load cards with a specific member (by username)						

* __labels__  
only load cards with a specific label (by name)
													
* __list_id__  
only load cards on a list with a specific id					

* __list__  
only load cards on a list with a specific name						

* __board_id__
only load cards on a board with a specific id	

* __board__  
only load cards on a board with a specific name

* __skip_card__  
skip cards (by name)

To use multiple filters you can separate them by ``` "|" ```

Sample:
--------
__URL:__ https://www.activeline.ro/trellodash/
													
* all cards from a specific organization  
https://www.activeline.ro/trellodash/?organization=mycompany|mycompany2

* all cards with a specific member  
https://www.activeline.ro/trellodash/?members=sampleuser						

* all cards with a specific label  
https://www.activeline.ro/trellodash/?labels=samplelabel|sample label2

* all cards with a specific label and user  
https://www.activeline.ro/trellodash/?labels=samplelabel&members=sampleuser	

* all cards with a specific label from a specific organization  
https://www.activeline.ro/trellodash/?labels=samplelabel&organization=mycompany

