// TypeScript file
var Doudizhu = (function (_super) {
    __extends(Doudizhu, _super);
    function Doudizhu() {
        _super.call(this);
        this.cardUtils = CardUtils.getInstance();
        /**=========================出牌逻辑=============================*/
        this.onMyTurn = false; //是否该我出牌
        this.cardArr = []; //准备出的牌组（点起来的）
        this.skinName = "resource/test.exml";
        this.init();
    }
    var d = __define,c=Doudizhu,p=c.prototype;
    // public createChildren():void
    // {
    //     //this.init();
    // }
    Doudizhu.getInstance = function () {
        if (!this._instance) {
            this._instance = new Doudizhu();
        }
        return this._instance;
    };
    p.init = function () {
        this.start.addEventListener(egret.TouchEvent.TOUCH_TAP, this.matchPlayer, this);
        this.my_poker.addEventListener(egret.TouchEvent.TOUCH_TAP, this.cardOnTouch, this);
        this.btn_yes.addEventListener(egret.TouchEvent.TOUCH_TAP, this.playCard, this);
        this.btn_no.addEventListener(egret.TouchEvent.TOUCH_TAP, this.playNo, this);
        NetController.getInstance().addListener(Commands.ROOM_NOTIFY, this);
        NetController.getInstance().addListener(Commands.PLAY_GAME, this);
        NetController.getInstance().connect();
    };
    /**开始匹配游戏*/
    p.matchPlayer = function () {
        this.start.enabled = false;
        this.tipTween();
        var data = new BaseMsg();
        data.command = Commands.MATCH_PLAYER;
        this.playerName = Math.floor(Math.random() * 100) + "";
        data.content = { "name": this.playerName };
        NetController.getInstance().sendData(data, this.onMatchPlayerBack, this);
    };
    p.tipTween = function () {
        this.start.visible = false;
        this.start_tip.visible = true;
        this.start_tip.rotation = 5;
        egret.Tween.get(this.start_tip, { loop: true })
            .to({ rotation: -5 }, 500, egret.Ease.backInOut)
            .to({ rotation: 5 }, 500, egret.Ease.backInOut);
    };
    /**匹配完毕,分配座位,开始发牌*/
    p.onMatchPlayerBack = function (data) {
        console.log('匹配返回', data);
        if (data.code == 0) {
            console.log('匹配成功' + '玩家有：' + data.content.players);
            var players = data.content.players;
            this.roomId = data.content.roomId;
            this.start_tip.visible = false;
            for (var i = 0; i < players.length; i++) {
                if (this.playerName == players[i]) {
                    this.my_id.text = (i + 1) + '号位：' + players[i];
                    this.mySeat = i + 1;
                    if (i == 2) {
                        this.right_id.text = '1号位：' + players[0];
                        this.left_id.text = '2号位：' + players[1];
                        this.leftSeat = 2;
                        this.rightSeat = 1;
                    }
                    else if (i == 0) {
                        this.right_id.text = '2号位：' + players[1];
                        this.left_id.text = '3号位：' + players[2];
                        this.leftSeat = 3;
                        this.rightSeat = 2;
                    }
                    else {
                        this.right_id.text = '3号位：' + players[2];
                        this.left_id.text = '1号位：' + players[0];
                        this.leftSeat = 1;
                        this.rightSeat = 3;
                    }
                }
            }
            this.my_id.visible = true;
            this.left_id.visible = true;
            this.right_id.visible = true;
        }
    };
    /**收到服务器消息*/
    p.onReciveMsg = function (data) {
        console.warn('onReciveMsg');
        var command = data.command;
        switch (command) {
            case Commands.ROOM_NOTIFY:
                //this.onReciveRoomNotify(data.content);
                break;
            case Commands.PLAY_GAME:
                this.onRecivePlayGame(data.content);
        }
    };
    /**房间消息*/
    p.onRecivePlayGame = function (content) {
        //2是结算，1是游戏中, 0是第一次发牌
        var state = content.state;
        if (state == undefined)
            return;
        switch (state) {
            case 0:
                var cards = content.cards;
                console.log('cards', cards);
                this.refreshMyCard(cards.sort(function (a, b) { return b - a; }));
                break;
            case 1:
                this.onGamePlay(content);
        }
    };
    /**游戏进程消息*/
    p.onGamePlay = function (content) {
        var seat = content.curPlayerIndex;
        this.showRect(seat);
        if (seat == this.mySeat) {
            this.onMyTurn = true;
        }
        this.curCards = content.curCard;
        console.log('onRecivePlayGame', content);
    };
    p.showRect = function (index) {
        if (index == this.leftSeat) {
            this.rect_1.visible = true;
            this.rect_2.visible = false;
            this.rect_3.visible = false;
            this.btn_no.visible = false;
            this.btn_yes.visible = false;
        }
        else if (index == this.mySeat) {
            this.rect_1.visible = false;
            this.rect_2.visible = true;
            this.rect_3.visible = false;
            this.btn_no.visible = true;
            this.btn_yes.visible = true;
            this.btn_yes.enabled = false; //初始的时候不能出，选择了合适的牌才能出
        }
        else if (index == this.rightSeat) {
            this.rect_1.visible = false;
            this.rect_2.visible = false;
            this.rect_3.visible = true;
            this.btn_no.visible = false;
            this.btn_yes.visible = false;
        }
    };
    p.refreshMyCard = function (arr) {
        for (var i = 0; i < arr.length; i++) {
            var card = this.my_poker.getChildAt(i);
            card.index = arr[i];
        }
    };
    /**移除他人的扑克牌，只需要知道几张，和几号位*/
    p.removeOtherCard = function (num, seat) {
        while (num) {
            if (seat == this.rightSeat) {
                this.right_poker.removeChildAt(this.right_poker.numChildren - 1);
            }
            else {
                this.left_poker.removeChildAt(this.right_poker.numChildren - 1);
            }
            num--;
        }
    };
    /**自己的牌需要根据序号来移除*/
    p.removeMyCard = function (index) {
        for (var i = 0; i < this.my_poker.numChildren; i++) {
            var card = this.my_poker.getChildAt(i);
            if (card.index == index) {
                this.my_poker.removeChildAt(i);
            }
        }
    };
    /**点击扑克*/
    p.cardOnTouch = function (e) {
        console.warn(this.curCards);
        if (!this.onMyTurn)
            return; //不该我出牌的时候点不动
        var card = e.target;
        if (card.onTouch) {
            card.onTouch = false;
            if (this.cardArr.indexOf(card) !== -1) {
                this.cardArr.splice(this.cardArr.indexOf(card), 1);
            }
        }
        else {
            card.onTouch = true;
            this.cardArr.push(card);
        }
        if (this.cardUtils.canPlay(this.curCards, this.cardArr)) {
            this.btn_yes.enabled = true;
        }
        else {
            this.btn_yes.enabled = false;
        }
    };
    ;
    /**点击出牌按钮*/
    p.playCard = function () {
        var type = CardUtils.getInstance().calcCardType(this.cardArr);
        var header = CardUtils.getInstance().calcHeadPoker(type, this.cardArr);
        var data = new BaseMsg();
        data.command = Commands.PLAYER_PLAYCARD;
        data.content = { roomId: this.roomId, index: this.mySeat, curCards: { type: type, header: header, cards: this.cardUtils.transCardsToIndex(this.cardArr) } };
        NetController.getInstance().sendData(data, this.onPlayCardBack, this);
    };
    /**获得出牌的返回消息*/
    p.onPlayCardBack = function (data) {
        if (data.code == 0) {
            console.log('出牌成功');
        }
    };
    /**点击过*/
    p.playNo = function () {
        var type = CARD_TYPE.PASS_CARDS;
        var data = new BaseMsg();
        data.command = Commands.PLAYER_PLAYCARD;
        data.content = { index: this.mySeat, curCards: { type: type } };
        NetController.getInstance().sendData(data, this.onPlayCardBack, this);
    };
    return Doudizhu;
}(eui.Component));
egret.registerClass(Doudizhu,'Doudizhu');
//# sourceMappingURL=Douzizhu.js.map