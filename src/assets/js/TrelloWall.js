class TrelloWall {
    constructor() {
        this.renderedMembers;
        this.boardHash;
        this.listHash;
        this.organizationFilter = this.param('organization');
        this.usernameFilter = this.param('members');
        this.labelFilter = this.param('labels');

        this.listIdFilter = this.param('list_id');
        this.listNameFilter = this.param('list');

        this.notListNameFilter = this.param('skip_card');


        this.boardIdFilter = this.param('board_id');
        this.boardNameFilter = this.param('board');
        this.notBoardNameFilter = this.param('skip_board');

        if (this.param('refresh')) {
            this.refresh = this.param('refresh')
        }
        this.refresh = 60;
    }

    param(name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");

        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.href);
        if (results == null)
            return "";
        else
            return decodeURI(results[1]).replace('+', ' ');
    }

    onAuthorize() {

        console.log(token)
        this.updateLoggedIn();
        this.renderedMembers = [];

        $("#output").empty();

        var $membersContent = $("#members-content")
        $membersContent.empty();

        window.Trello.members.get("me", (member) => {
            console.log(member)
            $("#fullName").text(member.fullName);

            var $boards = $("#board");
            $boards.html('');

            var boardUrl = "";
            if (this.organizationFilter)
                boardUrl = "organizations/" + this.organizationFilter + "/boards";
            else
                boardUrl = "members/me/boards?token=" + token;

            window.Trello.get(boardUrl, (boards) => {
                console.log(boards)
                $.each(boards, (ix, board) => {
                    var isValidBoard = true;

                    if (isValidBoard && this.boardNameFilter) {
                        isValidBoard = jQuery.inArray(board.name, this.boardNameFilter.split('|')) !== -1;
                    }

                    if (isValidBoard && this.notBoardNameFilter) {
                        if (jQuery.inArray(board.name, this.notBoardNameFilter.split('|')) !== -1) {
                            isValidBoard = false;
                        }
                    }

                    if (isValidBoard && this.boardIdFilter) {
                        isValidBoard = jQuery.inArray(board.id, this.boardIdFilter.split('|')) !== -1;
                    }

                    var hiddenBoards = JSON.parse(localStorage.getItem('hiddenBoards')) || {};
                    if (hiddenBoards[board.id] !== undefined) {
                        isValidBoard = false;
                    }

                    if (isValidBoard) {
                        this.boardHash[board.id] = board;

                        var boardTpl = '<div class="list-wrapper">' +
                            '<div class="list">\n' +
                            '<div class="list-header"><h2 class="list-header-name" dir="auto"> <a data-board-name="' + board.name + '" data-board="' + board.id + '" href="#" class="boardHide"><span class="icon-sm icon-subscribe"></span></a></h2> </div>\n' +
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

                        window.Trello.get("/boards/" + board.id + "/lists", (lists) => {
                            $.each(lists, (ix, list) => {
                                var isValidList = true;

                                if (isValidList && this.listNameFilter) {
                                    isValidList = jQuery.inArray(list.name, this.listNameFilter.split('|')) !== -1;
                                }

                                if (isValidList && this.listIdFilter) {
                                    isValidList = jQuery.inArray(list.id, this.listIdFilter.split('|')) !== -1;
                                }

                                if (isValidList) {
                                    this.listHash[list.id] = list;
                                }
                            });
                        });
                    }

                });

                $('.boardHide').on('click', (event) => {
                    event.preventDefault();
                    let boardId = $(this).data('board');
                    let boardName = $(this).data('board-name');
                    $('#board_' + boardId).hide();

                    let hiddenBoards = JSON.parse(localStorage.getItem('hiddenBoards')) || {};
                    hiddenBoards[boardId] = boardName;
                    console.log(hiddenBoards);
                    localStorage.setItem('hiddenBoards', JSON.stringify(hiddenBoards));

                    this.showHiddenBoards();
                });

                $('body').on('click', '.unhideBoard', (event) => {
                    event.preventDefault();
                    var boardId = $(this).data('board');
                    $('#board_' + boardId).show();
                    var hiddenBoards = JSON.parse(localStorage.getItem('hiddenBoards')) || {};
                    var keys = Object.keys(hiddenBoards);
                    var newBoards = {};
                    for (var i = 0; i < keys.length; i++) {
                        if (keys[i] !== boardId) {
                            newBoards[keys[i]] = hiddenBoards[keys[i]];
                        }
                    }
                    localStorage.setItem('hiddenBoards', JSON.stringify(newBoards));
                    window.location.reload();
                });

                this.showHiddenBoards();
                console.log("loading cards...");


                //load & render cards..
                if (this.usernameFilter) {
                    Trello.get("/members/" + this.usernameFilter + "/cards?members=true", (cards) => {
                        this.renderCards(cards);
                    });
                } else if (this.listIdFilter || this.listNameFilter) {
                    console.log("loading cards - by lists..");
                    for (var listId in this.listHash) {
                        console.log("loading cards - by list " + listId + "..")
                        var cardsUrl = "/lists/" + listId + "/cards?members=true";
                        Trello.get(cardsUrl, (cards) => {
                            this.renderCards(cards);
                        });
                    }
                } else {
                    console.log("loading cards - by boards..");
                    for (var boardId in this.boardHash) {
                        console.log("loading cards - by board " + boardId + "..")
                        let cardsUrl = "/boards/" + boardId + "/cards?members=true";
                        Trello.get(cardsUrl, (cards) => {
                            this.renderCards(cards);
                        });
                    }
                }
            });
        });

    }

    updateLoggedIn() {
        const token = Trello.token();
        Trello.setToken(token);
        var isLoggedIn = window.Trello.authorized();
        console.log('Authorized', isLoggedIn)
        $("#loggedout").toggle(!isLoggedIn);
    }

    showHiddenBoards() {
        var hiddenBoards = JSON.parse(localStorage.getItem('hiddenBoards')) || {};
        var boardsLinks = '';

        var keys = Object.keys(hiddenBoards);
        for (var i = 0; i < keys.length; i++) {
            console.log(hiddenBoards[keys[i]]);
            boardsLinks += '<a style="color:#fff;font-weight: bold; padding-right: 10px;text-decoration: none;" href="#" data-board="' + keys[i] + '" class="unhideBoard"><span style="color:#fff;" class="icon-sm icon-subscribe"></span> ' + hiddenBoards[keys[i]] + '</a>';
        }
        $('.hiddenBoards').html(boardsLinks);
    }

    renderCards(cards) {
        let $loading = $("#loading");
        let boardIds = [];
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


        $.each(cards, (ix, card) => {
            var isValidCard = true;

            if (isValidCard && this.notListNameFilter) {
                isValidCard = jQuery.inArray(card.name, this.notListNameFilter.split('|')) === -1;
            }

            if (isValidCard && this.labelFilter) {
                isValidCard = false;
                for (let i = 0; i < card.labels.length; i++) {
                    if (jQuery.inArray(card.labels[i].name, this.labelFilter.split('|')) !== -1) {
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
                        let $cardMemberContainer = $('<div>')
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

    logout() {
        window.Trello.deauthorize();
        $('#boards').html('');
        this.updateLoggedIn();
    }

    init() {
        setInterval(() => {
            this.onAuthorize()
        }, this.refresh * 1000);

        $("#loggedout").toggle(true);

        window.Trello.authorize({
            interactive: false,
            success: () => {
                localStorage.setItem('trello_token2', Trello.token())
                localStorage.setItem('trello_token', Trello.token())
                this.onAuthorize()
            },
            name: "TrelloDash",
            expiration: "never",
            persist: true
        });

        $("#connectLink").click(() => {
            window.Trello.authorize({
                type: "redirect",
                success: () => {
                    localStorage.setItem('trello_token', Trello.token())
                    localStorage.setItem('trello_token2', Trello.token())
                    this.onAuthorize()
                },
                name: "TrelloDash",
                expiration: "never",
                persist: true
            })
        });

        $("#disconnect").click(this.logout());
    }
}

export default TrelloWall