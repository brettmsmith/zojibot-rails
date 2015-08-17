require 'json'
require 'rest-client'

class DashboardController < ApplicationController
    @token = 0
    def index
    end

    def login
        #redirect to twitch login (redirect_to())
        if @token == 0
            redirect_to "/https://api.twitch.tv/kraken/oauth2/authorize
                ?response_type=code
                &client_id=#{TwitchAPI.clientid}
                &redirect_uri=localhost:3000/callback"
        else
            redirect_to "/dashboard"
        end
    end

    def callback
        @usercode = params[:code]
        api = TwitchAPI.new()
        stuff = api.authorize(@usercode)
        @token = stuff['access_token']
        redirect_to "/dashboard"
    end

    def home
    end
end

class TwitchAPI
    def initialize()
        @base = 'https://api.twitch.tv/kraken'
        @redirect = 'localhost:3000/callback'
        @clientid = ENV['CLIENTID']
        @clientsecret = ENV['CLIENTSECRET']
    end

    def authorize(authcode)
        data = {'client_id'=>@clientid, 'client_secret'=>@clientsecret, 'grant_type'=>'authorizaton_code','redirect_uri'=>@redirect, 'code'=>authcode}
        ret = RestClient.post "#{@base}/oauth2/token", data
        JSON.parse(ret)
    end
end
