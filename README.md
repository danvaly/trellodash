TrelloDash
==========
Show all cards from different boards that match specific filters. 

Filters:
--------
Those filters are set by url-parameters.  
													
* __board_organization__  
only load cards on boards from a specific organization					

* __card_members_username__  
only load cards with a specific member (by username)						

* __card_labels_name__  
only load cards with a specific label (by name)
													
* __list_id__  
only load cards on a list with a specific id					

* __list_name__  
only load cards on a list with a specific name						

* __board_id__
only load cards on a board with a specific id	

* __board_name__  
only load cards on a board with a specific name


Sample:
--------
__URL:__ https://www.activeline.ro/trellowall/
													
* all cards from a specific organization  
https://www.activeline.ro/trellowall/?board_organization=mycompany

* all cards with a specific member  
https://www.activeline.ro/trellowall/?card_members_username=sampleuser						

* all cards with a specific label  
https://www.activeline.ro/trellowall/?card_labels_name=samplelabel

* all cards with a specific label and user  
https://www.activeline.ro/trellowall/?card_labels_name=samplelabel&card_members_username=sampleuser	

* all cards with a specific label from a specific organization  
https://www.activeline.ro/trellowall/?card_labels_name=samplelabel&board_organization=mycompany

