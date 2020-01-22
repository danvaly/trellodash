$.urlParam = function(name){
	name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");

	var regexS = "[\\?&]" + name + "=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(window.location.href);
	if (results == null)
		return "";
	else
		return decodeURI(results[1]).replace('+',' ');
}


var organizationFilter = $.urlParam('organization');
var usernameFilter = $.urlParam('members');
var labelFilter = $.urlParam('labels');

var listIdFilter = $.urlParam('list_id');
var listNameFilter = $.urlParam('list');

var notListNameFilter = $.urlParam('skip_card');


var boardIdFilter = $.urlParam('board_id');
var boardNameFilter = $.urlParam('board');


var renderedMembers = [];
var boardHash = {};
var listHash = {};


function onAuthorize() {
	updateLoggedIn();
	renderedMembers = [];

	$("#output").empty();

	var $membersContent = $("#members-content")
	$membersContent.empty();

	Trello.members.get("me", function (member) {
		$("#fullName").text(member.fullName);

		var $boards = $("#board");
		$boards.html('');

		var boardUrl = "";
		if (organizationFilter)
			boardUrl = "organizations/" + organizationFilter + "/boards";
		else
			boardUrl = "members/me/boards";

		Trello.get(boardUrl, function (boards) {
			$.each(boards, function (ix, board) {
				var isValidBoard = true;

				if (isValidBoard && boardNameFilter) {
					isValidBoard = false;
					if (board.name == boardNameFilter) {
						isValidBoard = true;
					}
				}

				if (isValidBoard && boardIdFilter) {
					isValidBoard = false;
					if (board.id == boardIdFilter) {
						isValidBoard = true;
					}
				}

				if (isValidBoard) {
					boardHash[board.id] = board;

					var boardTpl = '<div class="list-wrapper">' +
						'<div class="list">\n' +
						'<div class="list-header"><h2 class="list-header-name" dir="auto"></h2></div>\n' +
						'</div>' +
						'</div>';

					var $boardModule = $(boardTpl)
						.attr({id: "board_" + board.id})
						.appendTo($boards);
					$boardModule.hide();

					var $boardTitle = $boardModule.find('.list-header-name').first();
					var $boardListContainer = $boardModule.find('.list').first();

					var $boardLink = $("<a>")
						.attr({href: board.url, target: "trello"})
						.text(board.name)
						.css('text-decoration','none')
						.css('font-size','16px')
						.appendTo($boardTitle);

					var $boardCards = $('<div class="list-cards"></div>')
						.attr({id: "boardcards_" + board.id})
						.appendTo($boardListContainer);

					if (board.prefs.backgroundColor){
						$boardModule.find('.list').css('background-color',board.prefs.backgroundColor);
					}

					Trello.get("/boards/" + board.id + "/lists", function (lists) {
						$.each(lists, function (ix, list) {
							var isValidList = true;

							if (isValidList && listNameFilter) {
								isValidList = false;
								if (list.name == listNameFilter) {
									isValidList = true;
								}
							}

							if (isValidList && listIdFilter) {
								isValidList = false;
								if (list.id == listIdFilter) {
									isValidList = true;
								}
							}

							if (isValidList) {
								listHash[list.id] = list;

							}
						});
					});
				}
			});

			console.log("loading cards...");


			//load & render cards..
			if (usernameFilter) {
				Trello.get("/members/" + usernameFilter + "/cards?members=true", function (cards) {
					renderCards(cards);
				});
			} else if (listIdFilter || listNameFilter) {
				console.log("loading cards - by lists..");
				for (var listId in listHash) {
					console.log("loading cards - by list " + listId + "..")
					var cardsUrl = "/lists/" + listId + "/cards?members=true";
					Trello.get(cardsUrl, function (cards) {
						renderCards(cards);
					});
				}
			} else {
				console.log("loading cards - by boards..");
				for (var boardId in boardHash) {
					console.log("loading cards - by board " + boardId + "..")
					var cardsUrl = "/boards/" + boardId + "/cards?members=true";
					Trello.get(cardsUrl, function (cards) {
						renderCards(cards);
					});
				}
			}
		});
	});
};

function renderCards(cards) {
	var $loading = $("#loading");
	var boardIds = new Array();
	$loading.text("check/render cards...");
	console.log("check/render cards");


	cards.sort(function (a, b) {
		// a and b will here be two objects from the array
		// thus a[1] and b[1] will equal the names

		// if they are equal, return 0 (no sorting)
		var nameA = a.idBoard;
		var nameB = b.idBoard;

		if (nameA < nameB) //sort string ascending
			return -1;
		if (nameA > nameB)
			return 1;

		return 0; //default return value (no sorting)
	});


	$.each(cards, function (ix, card) {
		var isValidCard = true;

		if (isValidCard && notListNameFilter) {
			isValidCard = false;
			if (card.name !== notListNameFilter) {
				isValidCard = true;
			}
		}

		if (isValidCard && labelFilter) {
			isValidCard = false;
			for (i = 0; i < card.labels.length; i++) {
				if (card.labels[i].name == labelFilter) {
					isValidCard = true;
				}
			}
		}


		if (isValidCard) {
			boardIds.push(card.idBoard);

			$("#board_" + card.idBoard).show();



			var $cardContainer = $('<a class="list-card" href=""></a>')
				.attr({href: card.url, target: "trello", id: "card_" + card.id})
				.appendTo("#boardcards_" + card.idBoard);

			BoardSelector = "#boardcards_" + card.idBoard;

			var $card = $('<div class="list-card-details"></div>')
				.appendTo($cardContainer);

			var $cardLabels = $("<div>")
				.addClass("card-labels")
				.appendTo($card);

			var $cardTitle = $("<span>")
				.addClass('list-card-title')
				.attr('dir', 'auto')
				.text(card.name)
				.appendTo($card);

			var $cardList = $("<p>")
				.addClass("list-card-position quiet")
				.html("In <strong>" + listHash[card.idList].name + "</strong>")
				.appendTo($cardLabels);

			var $cardMembers = $("<div>")
				.addClass("list-card-members")
				.appendTo($card);

			for (i = 0; i < card.members.length; i++) {
				var $cardMember;
				if (card.members[i].avatarHash) {
					var avatarUrl = 'https://trello-avatars.s3.amazonaws.com/' + card.members[i].avatarHash + '/30.png';
					$cardMemberContainer = $('<div>')
						.addClass('member')
						.appendTo($cardMembers);

					$cardMember = $("<img>")
						.attr({src: avatarUrl, alt: card.members[i].fullName})
						.addClass("member-avatar")
						.attr('width',30)
						.attr('height',30)
						.appendTo($cardMemberContainer);
				} else {
					$cardMember = $("<span>")
						.text(card.members[i].initials)
						.addClass("userinitials")
						.attr('width',30)
						.attr('height',30)
						.appendTo($cardMembers);
				}
			}
		}
	});
	console.log("done loading");
}

function updateLoggedIn() {
	var isLoggedIn = Trello.authorized();
	$("#loggedout").toggle(!isLoggedIn);
	$("#loggedin").toggle(isLoggedIn);
};

function logout() {
	Trello.deauthorize();
	$('#boards').html('');
	updateLoggedIn();
};

$(document).ready(function () {
	var refresh = $.urlParam('refresh');
	if (!refresh) {
		refresh = 60;
	}
	setInterval("onAuthorize()", refresh * 1000);


	$("#loggedout").toggle(true);
	$("#loggedin").toggle(false);

	Trello.authorize({
		interactive: false,
		success: onAuthorize,
		name: "TrelloWall",
		expiration: "never",
		persist: true
	});

	$("#connectLink")
		.click(function () {
			Trello.authorize({
				type: "rederict",
				success: onAuthorize,
				name: "TrelloWall",
				expiration: "never",
				persist: true
			})
		});

	$("#disconnect").click(logout);
});
