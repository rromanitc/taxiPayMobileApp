import React, { Component } from "react";
import { View, Text, StyleSheet, Dimensions, Image, RefreshControl } from "react-native";
import {
  ScrollView,
  FlatList,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native-gesture-handler";
import FloatingLabelInput from "../../components/floatingLabelInput";
import MyButton from "../../components/myButton";
import Animated from "react-native-reanimated";
import Method from "../../components/method";
import API, { API_GET_METHODS, API_USER_BANKCARD_DELETE, API_USER_BANKCARD_STORAGE } from "../../API";
import BankCard from "../../components/bankCard";

let isBacky = false;

export default class WithDrawScreen extends Component {
  constructor(props) {
    super(props);
    this.setUserSelectedPayMethod = this.props.setUserSelectedPayMethod.bind(this);
    this.setUserStoreBankCard = this.props.setUserStoreBankCard.bind(this);
    this.setUserForcePay = this.props.setUserForcePay.bind(this);

    this.item = this.props.item;
    this.state = {
      refreshing: false,
      selectedMethod: null,
      methods: [],
      selectedBankCard: null,
      bankCards: [],
      continueButtonStatus: 'disabled',
      balanceBoxStatus: true,
      moneyToPayValue: this.props.moneyToPay,
      moneyToPayValueRaw: this.props.moneyToPayRaw,
      check: false
    };
    this.isMoreBackup = 0;
    this.cardLogo = require("../../assets/taxiAppLogo_coloredMin.png");
    this.checkLogo = require("../../assets/okIcon_white.png");
    // switch (this.item.aggregator.type) {
    //   case 1:
    //     this.cardLogo = require("../../assets/yandexLogo.png");
    //     break;
    //   // case 2:
    //   //   this.cardLogo = require("../../assets/citimobilLogo.png");
    //   //   break;
    //   // case 3:
    //   //   this.cardLogo = require("../../assets/uberLogo.png");
    //   //   break;
    //   // case 4:
    //   //   this.cardLogo = require("../../assets/gettaxiLogo.png");
    //   //   break;
    //   default:
    //     this.cardLogo = require("../../assets/taxiAppLogo.png");
    //     break;
    // }
  }

  refresh = () => {
    this.setState({ refreshing: true, methods: [], selectedMethod: null, bankCards: [], selectedBankCard: null });
    let cards = false;
    isBacky = false;
    API.get(API_GET_METHODS + '/' + this.item.id).then(res => {
      console.log(res.data)
      this.setState({ refreshing: false, methods: res.data })
    });
    this.isMoreBackup = this.props.item.available_requests;
    console.log(this.isMoreBackup)
    this.checkContinueButtonStatus()
  };
  componentDidMount() {
    this.refresh();
    this.checkContinueButtonStatus()
    this.props.navigation.addListener('focus', () => {
     this.refresh();
     this.checkContinueButtonStatus()
    });
  }
  componentDidUpdate() {
    if (this.props.route.params !== undefined) {
      if (this.props.route.params.status !== undefined) {
        if (this.props.route.params.status === true && isBacky) {
          this.refresh()
          this.checkContinueButtonStatus()
        }
      }
    }
  }
  setUserMoneyToPayValue = (newText) => {
    this.props.setUserMoneyToPayValue(newText);
    this.setState({ moneyToPayValue: newText },
      () => { this.checkContinueButtonStatus() });
  };
  setUserCardNumberValue = (newText) => {
    this.props.setUserCardNumberValue(newText);
    this.checkContinueButtonStatus();
  };
  setUserMoneyToPayValueRaw = (newText) => {
    if (isNaN(newText)) {
      newText = 0;
    }
    this.props.setUserMoneyToPayValueRaw(newText);
    this.setState({ moneyToPayValueRaw: newText },
      () => { this.checkContinueButtonStatus() });
  };
  setUserCardNumberValueRaw = (newText) => {
    this.props.setUserCardNumberValueRaw(newText);
  };

  onMethodSelect = (id) => {
    let methods = [...this.state.methods];

    let selectedMethodInArr = methods.filter((method) => method.type === id)[0];
    let nonSelectedMethodInArr = methods.filter((method) => method.type !== id);

    selectedMethodInArr.isSelected = true;
    nonSelectedMethodInArr.map((method) => {
      method.isSelected = false;
    });

    this.setState({ methods: methods });
    this.setState({ selectedMethod: selectedMethodInArr, bankCards: selectedMethodInArr.cards }, () => {
      this.checkContinueButtonStatus();
      this.setUserCardNumberValue('')
      this.setUserCardNumberValueRaw('')

      this.props.setUserSelectedPayMethod(selectedMethodInArr);
      if (selectedMethodInArr.cards !== undefined) {
        if (selectedMethodInArr.cards.length > 0) {
          // console.log(selectedMethodInArr.cards[0])
          setTimeout(() => {
            this.onBankCardSelect(selectedMethodInArr.cards[0].id !== null ? selectedMethodInArr.cards[0].id : selectedMethodInArr.cards[0].external_id);
          }, 50)
        }
      }
    });
    // this.onBankCardSelect(selectedMethodInArr)

  };

  onBankCardSelect = (id) => {
    // console.log("ID " + id)
    let bankCards = [...this.state.bankCards];
    let selectedBankCardInArr = bankCards.filter((bankCard) => (bankCard.id !== null ? bankCard.id : bankCard.external_id) === id)[0];
    // console.log(bankCards)
    // console.log(selectedBankCardInArr)
    let nonSelectedBankCardInArr = bankCards.filter((bankCard) => (bankCard.id !== null ? bankCard.id : bankCard.external_id) !== id);

    selectedBankCardInArr.isSelected = true;
    nonSelectedBankCardInArr.map((bankCard) => {
      bankCard.isSelected = false;
    });

    this.setState({ bankCards: bankCards });
    this.setState({ selectedBankCard: selectedBankCardInArr }, () => {
      this.setUserCardNumberValue(selectedBankCardInArr.number)
      this.setUserCardNumberValueRaw(selectedBankCardInArr.number)
      setTimeout(() => {
        this.checkContinueButtonStatus();
      }, 50)
    });
    this.props.setUserSelectedBankCard(selectedBankCardInArr);
  };

  deleteBankCard = (id) => {
    let bankCards = [...this.state.bankCards];

    let selectedBankCardInArr = bankCards.filter((bankCard) => (bankCard.id !== null ? bankCard.id : bankCard.external_id) === id)[0];
    let nonSelectedBankCardInArr = bankCards.filter((bankCard) => (bankCard.id !== null ? bankCard.id : bankCard.external_id) !== id);
    if (this.state.selectedMethod.has_storage) {
      let request = this.sendRequest(selectedBankCardInArr)
      request.then(res => {
        console.log(res);
        this.setState({ bankCards: nonSelectedBankCardInArr, selectedBankCard: null });
      })
    } else {
      API.delete(API_USER_BANKCARD_DELETE + '/' + selectedBankCardInArr.id).then(res => {
        this.setState({ bankCards: nonSelectedBankCardInArr, selectedBankCard: null });
      })
    }
    this.checkContinueButtonStatus();
  }
  sendRequest = (selectedBankCardInArr) => {

    const formData = new FormData();
    formData.append('select_payout_method[payoutMethod]', this.state.selectedMethod.id)

    return API.post(API_USER_BANKCARD_STORAGE + '/' + this.item.id + '/delete/' + selectedBankCardInArr.external_id, formData)
  }

  addBankCard = () => {
    if (this.props.cardNumber === '') {
      return
    }
    let bankCards = [...this.state.bankCards];
    let bankCard = {
      external_id: 0,
      id: this.getNewBankCardId(),
      name: "Банковская карта",
      number: this.props.cardNumber,
      type: 2
    };

    bankCards.push(bankCard)

    this.setUserCardNumberValue("");
    this.setUserCardNumberValueRaw("");

    this.setState({ bankCards: bankCards });
  }
  addExternalBankCard = () => {
    const formData = new FormData();
    formData.append('select_payout_method[payoutMethod]', this.state.selectedMethod.id)
    API.post(API_USER_BANKCARD_STORAGE + '/' + this.item.id, formData).then(res => {
      console.log(res.data)
      this.openWebView(res.data)
      isBacky = true;
    })
  }
  openWebView = (data) => {
    this.props.navigation.navigate("Подтверждение карты", {
      data: data
    });
  }

  getNewBankCardId = () => {
    let bankCards = [...this.state.bankCards];
    let i = 1;

    let iterate = (i) => {
      if (checkId(i)) {
        return i;
      } else {
        i++;
        iterate(i);
      }
    }

    let checkId = (id) => {
      bankCards.map(el => {
        if (el.id === id) {
          return false;
        }
      })
      return true;
    }
    return iterate();
  }

  toggleCheck = () => {
    if (this.props.storeBankCard) {
      this.setUserStoreBankCard(false);
    } else {
      this.setUserStoreBankCard(true);
    }
  }
  toggleForce = () => {
    if (this.props.forcePay) {
      this.setUserForcePay(false);
    } else {
      this.setUserForcePay(true);
    }
  }

  checkContinueButtonStatus = () => {
    // console.log(this.props)
    if (this.props.item.available_requests < 1 && this.props.item.available_requests !== null) {
      this.setState({ continueButtonStatus: "disabled", balanceBoxStatus: "Доступный лимит запросов исчерпан" })
    } else {
      // console.log(parseInt(this.state.moneyToPayValueRaw))
      // console.log(this.item.balance)
      setTimeout(() => {
        console.log(this.state.moneyToPayValueRaw)

        // if (parseInt(this.state.moneyToPayValueRaw) < parseInt(this.item.balance)) {
          this.setState({ balanceBoxStatus: "" })
          if (this.state.selectedMethod !== null) {
            if (this.props.moneyToPayValueRaw !== '' && this.state.moneyToPayValueRaw !== NaN) {
              if (this.props.cardNumber !== '' && this.props.cardNumber !== null && this.props.cardNumber !== 0) {
                this.setState({ continueButtonStatus: "active", balanceBoxStatus: "" })
                console.log("active")
              } else {
                console.log("disabled1")
                this.setState({ continueButtonStatus: "disabled", balanceBoxStatus: "Номер карты не введён" })
              }
            } else {
              console.log("disabled2")
              this.setState({ continueButtonStatus: "disabled", balanceBoxStatus: "Некорректная сумма вывода" })
            }
          } else {
            console.log("disabled3")
            this.setState({ continueButtonStatus: "disabled", balanceBoxStatus: "Не выбран способ оплаты" })
          }
        // } else {
        //   console.log("disabled4")
        //   this.setState({ continueButtonStatus: "disabled", balanceBoxStatus: "Сумма не должна превышать ваш текущий баланс" })
        // }
      }, 10)
    }
  }


  render() {
    let commissionBox = "";
    let cardNumberLabel = null;
    let payOutBox = null;
    let storeCardStyle = {
      width: 22,
      height: 22,
      borderRadius: 4,
      borderStyle: 'solid',
      borderWidth: 2,
      borderColor: '#7f3cb5',
      alignItems: "center",
      backgroundColor: this.props.storeBankCard ? "#7f3cb5" : "transparent",
      justifyContent: "center",
    }
    let storeCardStyleImage = {
      opacity: this.props.storeBankCard ? 1 : 0
    }
    let forcePayStyle = {
      width: 22,
      height: 22,
      borderRadius: 4,
      borderStyle: 'solid',
      borderWidth: 2,
      borderColor: '#7f3cb5',
      alignItems: "center",
      backgroundColor: this.props.forcePay ? "#7f3cb5" : "transparent",
      justifyContent: "center",
    }
    let forcePayStyleImage = {
      opacity: this.props.forcePay ? 1 : 0
    }
    if (this.state.selectedMethod === null) {
      commissionBox = (
        <Text style={{ width: "100%", textAlign: "center" }}>
          Не выбран способ оплаты
        </Text>
      );
    } else {
      commissionBox = (
        <View style={styles.commissionBoxText}>
          <View
            style={{ justifyContent: "space-between", flexDirection: "row" }}
          >
            <Text style={styles.commissionText}>
              Макс. выплата: {this.state.selectedMethod.max_payout} ₽
            </Text>
            <Text style={styles.commissionText}>
              Комиссия: {this.state.selectedMethod.commission} %
            </Text>
          </View>
          <View
            style={[styles.comissionLine, { justifyContent: "space-between", flexDirection: "row" }]}
          >
            <Text style={styles.commissionText}>
              Мин. выплата: {this.state.selectedMethod.min_payout} ₽
            </Text>
            <Text style={styles.commissionText}>
              Фикс. комиссия: {this.state.selectedMethod.fixed_commission} ₽
            </Text>
          </View>
          <View
            style={[styles.comissionLine, { justifyContent: "space-between", flexDirection: "row" }]}
          >
            <Text style={styles.commissionText}>
              Мин. остаток: {this.state.selectedMethod.min_residue} ₽
              </Text>
            <Text style={styles.commissionText}>
              Мин. комиссия: {this.state.selectedMethod.min_commission} ₽
            </Text>
          </View>
        </View>
      );
      cardNumberLabel = (
        // <View style={styles.moduleWithInput}>
        <FloatingLabelInput
          maskType="custom"
          mask={this.state.selectedMethod.mask}
          label={this.state.selectedMethod.label}
          value={this.props.cardNumber}
          keyboardType="numeric"
          onChangeText={this.setUserCardNumberValue}
          onChangeTextRaw={this.setUserCardNumberValueRaw}
        />
        // </View> 
      );
      payOutBox = (
        <View style={styles.module}>
          <View style={styles.moduleHeaderBox}>
            <Text style={styles.moduleHeader}>Выберите</Text>
          </View>
          {this.state.bankCards.map((card) => (
            <BankCard
              bankCard={card}
              key={card.id !== null ? card.id : card.external_id}
              delete={() => this.deleteBankCard(card.id !== null ? card.id : card.external_id)}
              onPress={() => this.onBankCardSelect(card.id !== null ? card.id : card.external_id)}
            />
          ))}
          {!this.state.selectedMethod.has_storage ? (
            <View>
              <View style={styles.moduleInnput}>
                {cardNumberLabel}
              </View>
              {this.props.cardNumber !== '' ? (
                <TouchableOpacity
                  onPress={this.toggleCheck}>
                  <View style={{
                    padding: 10,
                    marginHorizontal: 15,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text>Запомнить?</Text>
                    </View>
                    <View style={storeCardStyle}>
                      <Image
                        style={storeCardStyleImage}
                        source={this.checkLogo} />
                    </View>
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
              <View style={{ marginTop: 10 }}>
                <MyButton
                  title="Привязать"
                  classType="primary"
                  withLoading="true"
                  status="active"
                  onPress={this.addExternalBankCard}
                />
              </View>
            )}
        </View>
      )
    }
    return (
      <ScrollView
        contentContainerStyle={{ paddingTop: 50, paddingBottom: 300 }}
        style={{ flex: 1, backgroundColor: '#fff' }}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this.refresh}
          />
        }
      >
        <View style={styles.pageHeaderBox}>
          {/* <Text style={styles.pageHeader}>{this.item.aggregator.name}</Text> */}
          <Image style={styles.pageHeaderImage} source={this.cardLogo} />
        </View>

        <View style={styles.module}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <Text style={styles.balanceBoxText}>{this.item.balance}</Text>
            <Text style={styles.balanceBoxExt}>₽</Text>
          </View>
        </View>
        <View style={styles.module}>
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Text>{this.item.name}</Text>
          </View>
        </View>
        <View style={styles.moduleWithDraw}>
          <View style={styles.moduleHeaderWithDrawBox}>
            <Text style={styles.moduleHeaderWithDraw}>Способы вывода</Text>
          </View>
          {this.state.methods.map((method) => (
            <Method
              method={method}
              key={method.type}
              onPress={() => this.onMethodSelect(method.type)}
            />
          ))}
        </View>
        {payOutBox}
        <View style={styles.moduleWithDraw}>
          <View style={[styles.moduleHeaderWithDrawBox, { justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }]}>
            {this.props.item.available_requests !== null ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text>
                  Доступных заявок:
                </Text>
                <View style={[styles.statusBarBox, { backgroundColor: this.isMoreBackup < 1 ? "#f24a24" : "#bbf224" }]}><Text style={[styles.statusBarText, { color: this.isMoreBackup < 1 ? 'white' : 'black' }]}>{this.props.item.available_requests}</Text></View>
              </View>
            ) : null}
            <Text style={styles.moduleHeaderWithDraw}>Сумма вывода</Text>
          </View>
          <View style={styles.moduleWithInput}>
            <FloatingLabelInput
              maskType="money"
              maskTypeOptions={{
                precision: 0,
                separator: ' ',
                delimiter: ' ',
                unit: '',
                suffixUnit: ''
              }}
              label="Сумма вывода"
              value={this.props.moneyToPay}
              onChangeText={this.setUserMoneyToPayValue}
              onChangeTextRaw={this.setUserMoneyToPayValueRaw}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={styles.module}>
          <View style={styles.moduleHeaderBox}>
            <Text style={styles.moduleHeader}>Комиссия</Text>
          </View>
          {commissionBox}
        </View>
        <View>

          <TouchableOpacity
            onPress={this.toggleForce}>
            <View style={{
              padding: 10,
              marginHorizontal: 30,
              marginTop: 15,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <View style={{ flex: 1 }}>
                <Text>Отправить на ручную обработку</Text>
              </View>
              <View style={forcePayStyle}>
                <Image
                  style={forcePayStyleImage}
                  source={this.checkLogo} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.balanceBoxStatusStyleBox}>
          <Text style={styles.balanceBoxStatusStyle}>{this.state.balanceBoxStatus}</Text>
        </View>
        <View style={{ margin: 20 }}>
          <MyButton
            title="Продолжить"
            classType="primary"
            withLoading="true"
            status={this.state.continueButtonStatus}
            onPress={() => this.props.navigation.navigate('Подтверждение')}
          />
        </View>
      </ScrollView>
    );
  }
}
const styles = StyleSheet.create({
  statusBarBox: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginLeft: 5,
    borderRadius: 5,
  },
  statusBarText: {
    textAlign: 'center',
  },
  pageHeaderBox: {
    position: "relative",
    alignItems: 'center'
  },
  pageHeader: {
    fontSize: 30,
    fontWeight: "300",
    padding: 10,
    textAlign: "right",
    position: "relative",
    zIndex: 20,
  },
  pageHeaderImage_old: {
    position: "relative",
    width: 170,
    height: 170,
    top: -32,
    right: -20,
    opacity: 0.2,
  },
  pageHeaderImage: {
    width: 220,
    height: 66,
    marginBottom: 5,
  },
  module: {
    width: Dimensions.get("window").width - 20,
    margin: 10,
    backgroundColor: "white",
    marginHorizontal: 10,
    marginTop: 5,
    marginBottom: 5,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 17,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  moduleWithDraw: {
    width: Dimensions.get("window").width - 20,
    margin: 10,
    backgroundColor: "white",
    marginHorizontal: 10,
    marginTop: 5,
    marginBottom: 5,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 7,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  moduleWithInput: {
    width: Dimensions.get("window").width - 60,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleInnput: {
    // width: Dimensions.get("window").width - 40,
    // marginHorizontal: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleHeader: {
    fontWeight: "600",
    fontSize: 16,
    textAlign: "right",
    width: "100%",
  },
  moduleHeaderWithDraw: {
    fontWeight: "600",
    fontSize: 16,
    textAlign: "right",
  },
  moduleHeaderWithDrawBox: {
    marginTop: 6,
    marginBottom: 10,
    paddingBottom: 12,
    marginHorizontal: 10,
    borderBottomColor: "#dedede",
    borderBottomWidth: 1,
    borderStyle: "solid",
  },
  moduleHeaderBox: {
    marginTop: 0,
    marginBottom: 10,
    paddingBottom: 12,
    borderBottomColor: "#dedede",
    borderBottomWidth: 1,
    borderStyle: "solid",
  },
  balanceBoxText: {
    fontSize: 50,
    fontWeight: "300",
  },
  balanceBoxExt: {
    fontSize: 22,
    color: "#7f7f7f",
    marginBottom: 6,
    marginLeft: 4,
  },
  commissionBoxText: {},
  commissionText: {
    color: "#7f7f7f",
    fontSize: 12,
  },
  comissionLine: {
    width: "100%",
    borderTopColor: "#ededed",
    borderTopWidth: 1,
    borderStyle: "solid",
    marginTop: 4,
    paddingTop: 4,
  },
  balanceBoxStatusStyleBox: {
    marginTop: 10,
    paddingHorizontal: 25,
    alignItems: 'center',
    textAlign: 'center'
  },
  balanceBoxStatusStyle: {
    fontSize: 12,
    color: "#f22424",
    height: 14
  }
});
