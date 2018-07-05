var encode = function (input) {
	return encodeURIComponent(input);
};

var decode = function (input) {
	return decodeURIComponent(input);
};

var showPage = function (pageID) {
	$('.page').hide();
	$('#' + pageID).show();
};

var reloadGamesList = function () {
	var $list = $('#list-games').empty();
	Object.keys(DATABASE).sort(function (a, b) {
		return DATABASE[a].title < DATABASE[b].title ? -1 : 1;
	}).forEach(function (gameID) {
		var game = DATABASE[gameID];
		$list.append('<li data-gameid="' + gameID + '">' + decode(game.title) + '<span>' + game.tags.join(', ') + '</span></li>');
	});
};

var displayGame = function (gameID) {
	var game = DATABASE[gameID];
	if (game) {
		$('#display-title').text(decode(game.title));
		$('#display-tags').text(game.tags.join(', '));
		if (!window.showdown) {
			$('#display-materials').html(decode(game.materials).replace(/\r/g, '<br>').replace(/\n/g, '<br>'));
			$('#display-description').html(decode(game.description).replace(/\r/g, '<br>').replace(/\n/g, '<br>'));
		} else {
			var converter = new showdown.Converter({
				omitExtraWLInCodeBlocks: true,
				noHeaderId: true,
				parseImgDimensions: true,
				literalMidWordUnderscores: true,
				strikethrough: true,
				tables: true,
				tasklists: true,
				simpleLineBreaks: true
			});
			$('#display-materials').html(converter.makeHtml(decode(game.materials)));
			$('#display-description').html(converter.makeHtml(decode(game.description)));
		}
		$('#main-display').data('gameID', gameID);
		showPage('main-display');
	}
};

var editGame = function (gameID) {
	if (!gameID) {
		$('#edit-title').val('');
		$('#edit-tags').val('');
		$('#edit-materials').val('');
		$('#edit-description').val('');
	} else {
		var game = DATABASE[gameID];
		$('#edit-title').val(decode(game.title));
		$('#edit-tags').val(game.tags.join(','));
		$('#edit-materials').val(decode(game.materials));
		$('#edit-description').val(decode(game.description));
	}
	$('#main-edit').data('gameID', gameID);
	showPage('main-edit');
};

var saveGame = function (gameID) {
	if (!gameID) {
		gameID = null;
		var charset = 'abcdefghijklmnopqrstuvwxyz';
		while (gameID === null || DATABASE[gameID]) {
			gameID = '';
			for (var i = 0; i < 6; ++i) {
				gameID += charset.charAt(Math.floor(Math.random() * charset.length));
			}
		}
	}
	var game = {
		id: gameID,
		title: encode($('#edit-title').val().trim()),
		tags: $('#edit-tags').val().trim().split(','),
		materials: encode($('#edit-materials').val()),
		description: encode($('#edit-description').val())
	};
	DATABASE[game.id] = game;
	reloadGamesList();
	displayGame(game.id);
};

// HEADER

$('#header-import').on('click', function () {
	$('#header-import-input').click();
});
$('#header-import-input').on('change', function () {
	var file = this.files[0];
	this.value = null;
	var reader = new FileReader();
	reader.onload = function (event) {
		try {
			DATABASE = JSON.parse(event.target.result);
		} catch (e) {
			alert('Error');
		}
		reloadGamesList();
	};
	reader.readAsText(file);
});
$('#header-export').on('click', function () {
	var json = JSON.stringify(DATABASE),
		blob = new Blob([json], { type: 'application/json;charset=UTF-8', encoding: 'UTF-8' });
	saveAs(blob, 'database.json');
});

// LIST

$('#list-toolbar-search').on('input', function () {
	var pattern = $(this).val().trim(),
		toShow = [],
		toHide = [];
	$('#list-games > li').each(function () {
		var $item = $(this),
			value = $item.text().toLowerCase();
		if (pattern === '' || value.indexOf(pattern) !== -1) {
			toShow.push($item[0]);
		} else {
			toHide.push($item[0]);
		}
	});
	$(toShow).show();
	$(toHide).hide();
});
$('#list-toolbar-add').on('click', function () {
	editGame();
});
$('#list-games').on('click', 'li', function () {
	var gameID = $(this).data('gameid');
	displayGame(gameID);
});

// DISPLAY

$('#display-toolbar-back').on('click', function () {
	showPage('main-list');
});
$('#display-toolbar-edit').on('click', function () {
	editGame($('#main-display').data('gameID'));
});

// EDIT

$('#edit-toolbar-back').on('click', function () {
	showPage('main-list');
});
$('#edit-toolbar-save').on('click', function () {
	saveGame($('#main-edit').data('gameID'));
});

var DATABASE = {};
reloadGamesList();
showPage('main-list');

if (self.fetch) {
	fetch('database.json').then(function (response) {
		if (response.ok) {
			return response.json();
		} else {
			throw new Error('status=' + response.status + ' - statusText=' + response.statusText);
		}
	}).then(function (json) {
		DATABASE = json;
		reloadGamesList();
	}).catch(function (error) {
		console.log('Database fetching failed: ' + error.message);
	});
}
