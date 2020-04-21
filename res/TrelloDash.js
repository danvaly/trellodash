$.urlParam = function (name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");

    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null)
        return "";
    else
        return decodeURI(results[1]).replace('+', ' ');
}


var organizationFilter = $.urlParam('organization');
var usernameFilter = $.urlParam('members');
var labelFilter = $.urlParam('labels');

var listIdFilter = $.urlParam('list_id');
var listNameFilter = $.urlParam('list');

var notListNameFilter = $.urlParam('skip_card');


var boardIdFilter = $.urlParam('board_id');
var boardNameFilter = $.urlParam('board');
var notBoardNameFilter = $.urlParam('skip_board');


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
                    if (jQuery.inArray(board.name, boardNameFilter.split('|')) !== -1) {
                        isValidBoard = true;
                    }
                }

                if (isValidBoard && notBoardNameFilter) {
                    if (jQuery.inArray(board.name, notBoardNameFilter.split('|')) !== -1) {
                        isValidBoard = false;
                    }
                }

                if (isValidBoard && boardIdFilter) {
                    isValidBoard = false;
                    if (jQuery.inArray(board.id, boardIdFilter.split('|')) !== -1) {
                        isValidBoard = true;
                    }
                }

                var hiddenBoards = JSON.parse(localStorage.getItem('hiddenBoards')) || {};
                if (hiddenBoards[board.id]!==undefined){
                    isValidBoard = false;
                }

                if (isValidBoard) {
                    boardHash[board.id] = board;

                    var boardTpl = '<div class="list-wrapper">' +
                        '<div class="list">\n' +
                        '<div class="list-header"><h2 class="list-header-name" dir="auto"> <a data-board-name="'+board.name+'" data-board="' + board.id + '" href="#" class="boardHide"><span class="icon-sm icon-subscribe"></span></a></h2> </div>\n' +
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
                        .css('text-decoration', 'none')
                        .css('font-size', '16px')
                        .appendTo($boardTitle);

                    var $boardCards = $('<div class="list-cards"></div>')
                        .attr({id: "boardcards_" + board.id})
                        .appendTo($boardListContainer);

                    if (board.prefs.backgroundColor) {
                        $boardModule.find('.list').css('background-color', board.prefs.backgroundColor);
                    }

                    Trello.get("/boards/" + board.id + "/lists", function (lists) {
                        $.each(lists, function (ix, list) {
                            var isValidList = true;

                            if (isValidList && listNameFilter) {
                                isValidList = false;
                                if (jQuery.inArray(list.name, listNameFilter.split('|')) !== -1) {
                                    isValidList = true;
                                }
                            }

                            if (isValidList && listIdFilter) {
                                isValidList = false;
                                if (jQuery.inArray(list.id, listIdFilter.split('|')) !== -1) {
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

            $('.boardHide').on('click', function (event) {
                event.preventDefault();
                var boardId = $(this).data('board');
                var boardName = $(this).data('board-name');
                $('#board_'+boardId).hide();

                var hiddenBoards = JSON.parse(localStorage.getItem('hiddenBoards')) || {};
                hiddenBoards[boardId] = boardName;
                console.log(hiddenBoards);
                localStorage.setItem('hiddenBoards', JSON.stringify(hiddenBoards));

                showHiddenBoards();
            });

            $('body').on('click','.unhideBoard',function(event){
                event.preventDefault();
                var boardId = $(this).data('board');
                $('#board_'+boardId).show();
                var hiddenBoards = JSON.parse(localStorage.getItem('hiddenBoards')) || {};
                var keys =  Object.keys(hiddenBoards);
                var newBoards = {};
                for(var i = 0;i<keys.length; i++){
                    if (keys[i]!== boardId){
                        newBoards[keys[i]] = hiddenBoards[keys[i]];
                    }
                 }
                localStorage.setItem('hiddenBoards', JSON.stringify(newBoards));
                window.location.reload();
            });

            showHiddenBoards();
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

function showHiddenBoards() {
    var hiddenBoards = JSON.parse(localStorage.getItem('hiddenBoards')) || {};
    var boardsLinks = '';

    var keys =  Object.keys(hiddenBoards);
    for(var i = 0;i<keys.length; i++){
        console.log(hiddenBoards[keys[i]]);
        boardsLinks+='<a style="color:#fff;font-weight: bold; padding-right: 10px;text-decoration: none;" href="#" data-board="'+keys[i]+'" class="unhideBoard"><span style="color:#fff;" class="icon-sm icon-subscribe"></span> '+hiddenBoards[keys[i]]+'</a>';
    }
    $('.hiddenBoards').html(boardsLinks);
}

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
            if (jQuery.inArray(card.name, notListNameFilter.split('|')) === -1) {
                isValidCard = true;
            }
        }

        if (isValidCard && labelFilter) {
            isValidCard = false;
            for (var i = 0; i < card.labels.length; i++) {
                if (jQuery.inArray(card.labels[i].name, labelFilter.split('|')) !== -1) {
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

            var $card = $('<div class="list-card-details"></div>')
                .appendTo($cardContainer);


            // <div class="list-card-cover js-card-cover" style="background-color: rgb(248, 247, 245); background-image: url(&quot;https://trello-attachments.s3.amazonaws.com/5de69e1ee8de4986c409cfa2/300x156/28a56fa574d9e876650057eee8acd207/image.png&quot;); height: 127.4px; background-size: cover;"></div>

            var $cardLabels = $("<div>")
                .addClass("card-labels")
                .appendTo($card);

            if (card.labels.length > 0) {
                for (var i = 0; i < card.labels.length; i++) {
                    var $cardLabelTpl = '<span class="card-label card-label-' + card.labels[i].color + ' mod-card-front"><span class="label-text">' + card.labels[i].name + '</span></span>';
                    $cardLabels.append($($cardLabelTpl));
                }
            }

            var $cardTitle = $("<span>")
                .addClass('list-card-title')
                .attr('dir', 'auto')
                .text(card.name)
                .appendTo($card);

            var $cardList = $("<div>")
                .addClass("badges")
                .html("<small>in <strong>" + listHash[card.idList].name + "</strong></small>")
                .appendTo($card);

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
                        .attr('width', 30)
                        .attr('height', 30)
                        .appendTo($cardMemberContainer);
                } else {
                    $cardMember = $("<span>")
                        .text(card.members[i].initials)
                        .addClass("userinitials")
                        .attr('width', 30)
                        .attr('height', 30)
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
