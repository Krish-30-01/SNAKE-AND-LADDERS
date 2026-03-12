import java.util.*;

class Player {
    String name;
    int position;

    Player(String name) {
        this.name = name;
        this.position = 0;
    }
}

public class Game {

    static final int WIN = 100;

    // Snakes and ladders using HashMap
    static HashMap<Integer, Integer> snakes = new HashMap<>();
    static HashMap<Integer, Integer> ladders = new HashMap<>();

    static Random rand = new Random();
    static Scanner sc = new Scanner(System.in);

    public static void main(String[] args) {

        initializeBoard();

        System.out.println("===== SNAKE AND LADDER GAME =====");

        System.out.print("Enter number of players: ");
        int n = sc.nextInt();
        sc.nextLine();

        // Queue for turn management
        Queue<Player> players = new LinkedList<>();

        for (int i = 1; i <= n; i++) {
            System.out.print("Enter Player " + i + " name: ");
            String name = sc.nextLine();
            players.add(new Player(name));
        }

        boolean gameWon = false;

        while (!gameWon) {

            Player current = players.poll();

            System.out.println("\n" + current.name + "'s turn");
            System.out.print("Press Enter to roll dice...");
            sc.nextLine();

            int dice = rollDice();
            System.out.println("Dice rolled: " + dice);

            movePlayer(current, dice);

            System.out.println(current.name + " position: " + current.position);

            if (current.position == WIN) {
                System.out.println("\n🎉 " + current.name + " WINS THE GAME!");
                gameWon = true;
            } else {
                players.add(current);
            }
        }
    }

    // Initialize snakes and ladders
    static void initializeBoard() {

        snakes.put(99, 54);
        snakes.put(70, 55);
        snakes.put(52, 42);
        snakes.put(25, 2);
        snakes.put(95, 72);

        ladders.put(6, 25);
        ladders.put(11, 40);
        ladders.put(17, 69);
        ladders.put(46, 90);
        ladders.put(60, 85);
    }

    // Dice roll
    static int rollDice() {
        return rand.nextInt(6) + 1;
    }

    // Move player
    static void movePlayer(Player player, int dice) {

        if (player.position + dice > WIN)
            return;

        player.position += dice;

        if (ladders.containsKey(player.position)) {
            System.out.println("Ladder found! Climb up!");
            player.position = ladders.get(player.position);
        }

        else if (snakes.containsKey(player.position)) {
            System.out.println("Snake bite! Slide down!");
            player.position = snakes.get(player.position);
        }
    }
}
