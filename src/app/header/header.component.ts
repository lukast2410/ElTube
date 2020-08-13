import { Component, OnInit } from '@angular/core';
import { NavbarService } from '../services/navbar.service';
import { SocialAuthService, GoogleLoginProvider } from 'angularx-social-login';
import { DataService } from '../services/data.service';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag'
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  user = null;
  loggedIn:boolean = false;
  users = [];
  createClicked: boolean = false;
  accountClicked: boolean = false;
  settingClicked: boolean = false;
  userPhoto: String;
  sidebarClick: boolean = false;
  restrict: boolean = false;

  userChannelLink: string;
  inputSearch: string = "";
  showAutoComplete: boolean = false;
  autocomplete = [];
  billings = [];

  keyboardShortcut: boolean = false;

  constructor(private navbar: NavbarService, private authService: SocialAuthService,
    private data: DataService, private apollo: Apollo, private route: ActivatedRoute,
    private router: Router) { }
  

  ngOnInit(): void {
    if(localStorage.getItem('users') == null){
      this.users = [];
    }
    else{
      this.getUserFromStorage();
      if(this.user.restricted == "false"){
        this.restrict = false;
      }else{
        this.restrict = true;
      }
      if(this.user.premium == "true"){
        this.getMyBilling();
      }
    }
    this.userPhoto = this.user.photourl;
  }

  checkKeyPress(event){
    if(event.keyCode == 13){
      this.doSearch();
    }
  }

  doSearch(){
    this.router.navigate(['/search'], {queryParams : {search_query : this.inputSearch}});
    this.showAutoComplete = false;
  }

  showDropDown(word: String): void{
    if(word == 'create'){
      this.createClicked = !this.createClicked;
      this.accountClicked = false;
      this.settingClicked = false;
    }else if(word == 'account'){
      this.createClicked = false;
      this.accountClicked = !this.accountClicked;
      this.settingClicked = false;
    }else if(word == 'setting'){
      this.createClicked = false;
      this.accountClicked = false;
      this.settingClicked = !this.settingClicked;
    }    
  }

  toggleKeyboardShortcut(){
    this.keyboardShortcut = !this.keyboardShortcut;
  }
  
  barsClicked(){
    this.navbar.barsClicked();
    this.sidebarClick = !this.sidebarClick;
  }
  
  toggleRestrictionMode(event){
    if(event.target.checked){
      this.restrict = true;
      this.updateUser(this.user, this.restrict.toString(), this.user.premium);
    }else{
      this.restrict = false;
      this.updateUser(this.user, this.restrict.toString(), this.user.premium);
    }
    console.log(this.restrict);
    // this.removeUser();
  }

  signin(): void {
      this.authService.signIn(GoogleLoginProvider.PROVIDER_ID);

      this.authService.authState.subscribe((user) => {
        console.log(user);
        this.user = user;
        this.loggedIn = (user != null);
        this.userPhoto = user.photoUrl;
        // this.addToLocalStorage(this.user);

        if(user != null){
          this.getOneUser(user);
          // this.updateUser(this.user);
          console.log(this.user);
        }
    });

  }

  getOneUser(user): void{
    this.apollo.mutate({
      mutation: gql `
        mutation GetOneUser ($emailUser: String!){
          getOneUser(email: $emailUser){
            id,
            name,
            email,
            photourl,
            location,
            restricted,
            premium
          }
        }
      `,
      variables: {
        emailUser: user.email
      }
    })
    .subscribe(result => {
      this.user = result.data;
      this.user = this.user.getOneUser;
      this.updateUser(this.user, this.user.restricted, this.user.premium);
      console.log(this.user);
    },(error)=>{
      this.createUser(user);
      console.log("create");
    })
  }

  createUser(user){
    this.apollo.mutate({
      mutation: gql `
        mutation CreateUser($name: String!, $email: String!, $photourl: String!, 
          $location: String!, $restricted: String!, $premium: String!){
            createUser(input: {
              name: $name, 
              email: $email, 
              photourl: $photourl, 
              location: $location, 
              restricted: $restricted, 
              premium: $premium
              }
            ){
              id
              name
              email
              photourl
              location
              restricted
              premium
            }
        }
      ` ,
      variables:{
        name: user.name,
        email: user.email,
        photourl: this.userPhoto,
        location: "Indonesia",
        restricted: "false",
        premium: "false"
      }
    }).subscribe(result => {
      this.user = result.data;
      this.user = this.user.createUser;
      if(this.user.restricted == "false"){
        this.restrict = false;
      }else{
        this.restrict = true;
      }
      this.removeUser();
      this.addToLocalStorage(this.user);
      location.reload();
      console.log(this.user);
    })
  }

  updateUser(user, restricted, premium){
    this.apollo.mutate({
      mutation: gql `
      mutation UpdateUser($name: String!, $email: String!, $photourl: String!, 
        $location: String!, $restricted: String!, $premium: String!){
          updateUser(email: $email, input: {
            name: $name, 
            email: $email, 
            photourl: $photourl, 
            location: $location, 
            restricted: $restricted, 
            premium: $premium
            }
          ){
            id
            name
            email
            photourl
            location
            restricted
            premium
          }
        }
      ` ,
      variables:{
        id: user.id,
        name: user.name,
        email: user.email,
        photourl: user.photourl,
        location: user.location,
        restricted: restricted,
        premium: premium
      }
    }).subscribe(result => {
      this.user = result.data;
      console.log(this.user);
      this.user = this.user.updateUser;
      console.log(this.user);
      if(this.user.restricted == "false"){
        this.restrict = false;
      }else{
        this.restrict = true;
      }
      this.removeUser();
      this.addToLocalStorage(this.user);
      location.reload();
    })
  }

  addToLocalStorage(user){
    this.users = [];
    this.users.push(user);
    localStorage.setItem('users', JSON.stringify(this.users));
  }

  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
    this.userChannelLink = this.user.name;
    this.userChannelLink = this.userChannelLink.toLowerCase();
    this.userChannelLink = this.userChannelLink.replace(" ", "-");
  }

  removeUser(){
    window.localStorage.clear();
    this.loggedIn = false;
  }
  
  getMyBilling(){
    this.apollo.watchQuery<any>({
      query: gql `
        query GetMyBilling($user_id: Int!){
          getMyBilling(user_id: $user_id){
            id
            user_id
            day
            month
            year
            tipe
          }
        }
      `,
      variables:{
        user_id: this.user.id,
      }
    }).valueChanges.subscribe(result => {
      this.billings = result.data.getMyBilling;
      let date = new Date(this.billings[0].year, this.billings[0].month-1, this.billings[0].day);
      if(this.billings[0].tipe == "anually"){
        date.setDate(date.getDate() + 365);
      }else if(this.billings[0].tipe == "monthly"){
        date.setDate(date.getDate() + 30);
      }
      if(new Date() > date){
        this.updateUser(this.user, this.user.restricted, "false");
      }
    })
  }

  signout(): void {
    this.removeUser();
    this.authService.signOut();
  }

  displayAutoComplete(event){
    if(this.inputSearch == "" || event.keyCode == 13){
      this.showAutoComplete = false;
      return;
    }else{
      this.getAutoComplete();
    }
  }

  getAutoComplete(){
    this.apollo.watchQuery<any>({
      query: gql `
        query AutoComplete($word: String!){
          autocomplete(word: $word)
        }
      `,
      variables:{
        word: this.inputSearch,
      }
    }).valueChanges.subscribe(result => {
      this.autocomplete = result.data.autocomplete;
      console.log(this.autocomplete);
      this.showAutoComplete = true;
    })
  }

  resultSelected(index){
    this.inputSearch = this.autocomplete[index];
    this.doSearch();
  }
}

